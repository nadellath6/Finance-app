import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import PreviewModal from "./PreviewModal";
import Header from "./layout/Header";
import "./KwitansiHonor.css"; // will trim after Bootstrap migration
import usePrint from "../hooks/usePrint";
import downloadElementAsPdf from "../lib/pdf";
import ReceiptDocument from "./Receipt";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import terbilang from "../lib/terbilang";
import { useToast } from "./ui/ToastProvider";

function KwitansiHonor() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [editId, setEditId] = useState(null);
  const [editSource, setEditSource] = useState(null);
  // Individual field states (will later refactor to single object if needed)
  const [lembar, setLembar] = useState("");
  const [buktiKas, setBuktiKas] = useState("");
  const [kodeRek, setKodeRek] = useState("");
  const [terimaDari, setTerimaDari] = useState("");
  const [uangSebanyak, setUangSebanyak] = useState("");
  const [untukPembayaran, setUntukPembayaran] = useState("");
  const [uraian] = useState(""); // no input currently per requirements
  const [nota, setNota] = useState(0); // Nota Pembayaran numeric value
  // Tax rates (%) for auto-calculation
  const [pph21Rate, setPph21Rate] = useState(0);
  const [pph22Rate, setPph22Rate] = useState(0);
  const [pph23Rate, setPph23Rate] = useState(0);
  const [ppnRate, setPpnRate] = useState(0);
  const [padRate, setPadRate] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [dirtyReady, setDirtyReady] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nextHref, setNextHref] = useState(null);
  // Signature fields
  const [penggunaNama, setPenggunaNama] = useState("");
  const [penggunaNip, setPenggunaNip] = useState("");
  const [pptkNama, setPptkNama] = useState("");
  const [pptkNip, setPptkNip] = useState("");
  const [bendaharaNama, setBendaharaNama] = useState("");
  const [bendaharaNip, setBendaharaNip] = useState("");
  const [penerimaNama, setPenerimaNama] = useState("");
  const notaNumber = Number(nota) || 0;
  const pph21Amount = Math.round(notaNumber * (Number(pph21Rate)||0) / 100);
  const pph22Amount = Math.round(notaNumber * (Number(pph22Rate)||0) / 100);
  const pph23Amount = Math.round(notaNumber * (Number(pph23Rate)||0) / 100);
  const ppnAmount = Math.round(notaNumber * (Number(ppnRate)||0) / 100);
  const padAmount = Math.round(notaNumber * (Number(padRate)||0) / 100);
  // Jumlah Diterimakan = Nota Pembayaran dikurangi seluruh pajak yang diinput (PPh21 selalu bisa dipakai)
  const jumlahDiterimakan = notaNumber - (pph21Amount + pph22Amount + pph23Amount + ppnAmount + padAmount);

  // Auto-convert jumlah diterimakan to words for "Uang Sebanyak"
  const uangSebanyakAuto = jumlahDiterimakan ? `${terbilang(jumlahDiterimakan)} Rupiah` : "";

  // Reset PPH21 when nota becomes 0 (user request)
  useEffect(() => {
    if (notaNumber === 0) {
      setPph21Rate(0); setPph22Rate(0); setPph23Rate(0); setPpnRate(0); setPadRate(0);
    }
  }, [notaNumber]);

  // Prefill when navigating from LaporanHonor (Edit)
  useEffect(() => {
    const st = location?.state;
    if (st?.editId && st?.payload) {
      setEditId(st.editId);
      setEditSource(st.source || null);
      const p = st.payload;
      setLembar(p.lembar || "");
      setBuktiKas(p.buktiKas || "");
      setKodeRek(p.kodeRek || "");
      setTerimaDari(p.terimaDari || "");
      setUntukPembayaran(p.untukPembayaran || "");
  setNota(Number(p.notaPembayaran) || 0);
  // Prefill tax rates if available; infer from stored amounts
  const _nota = Number(p.notaPembayaran) || 0;
  const infer = (amt) => (_nota>0 ? Math.round((Number(amt||0)/_nota)*10000)/100 : 0);
  setPph21Rate(Number(p.pph21Rate ?? infer(p.pph21)) || 0);
  setPph22Rate(Number(p.pph22Rate ?? infer(p.pph22)) || 0);
  setPph23Rate(Number(p.pph23Rate ?? infer(p.pph23)) || 0);
  setPpnRate(Number(p.ppnRate ?? infer(p.ppn)) || 0);
  setPadRate(Number(p.padRate ?? infer(p.pad)) || 0);
      const sig = p.signatures || {};
      setPenggunaNama(sig.pengguna?.nama || "");
      setPenggunaNip(sig.pengguna?.nip || "");
      setPptkNama(sig.pptk?.nama || "");
      setPptkNip(sig.pptk?.nip || "");
      setBendaharaNama(sig.bendahara?.nama || "");
      setBendaharaNip(sig.bendahara?.nip || "");
      setPenerimaNama(sig.penerima?.nama || "");
    }
    // Jika tidak ada prefill sama sekali, berarti mode BUAT BARU: reset semua field
    if (!st?.editId && !st?.payload) {
      // hentikan pelacakan dirty saat reset agar tidak memicu konfirmasi
      setDirtyReady(false);
      setEditId(null);
      setEditSource(null);
      setLembar("");
      setBuktiKas("");
      setKodeRek("");
      setTerimaDari("");
      setUntukPembayaran("");
  setNota(0);
  setPph21Rate(0); setPph22Rate(0); setPph23Rate(0); setPpnRate(0); setPadRate(0);
      setPenggunaNama("");
      setPenggunaNip("");
      setPptkNama("");
      setPptkNip("");
      setBendaharaNama("");
      setBendaharaNip("");
      setPenerimaNama("");
      try { window.localStorage.setItem('kwitansi_dirty','0'); } catch {}
      // aktifkan kembali pelacakan dirty pada frame berikutnya
      setTimeout(() => setDirtyReady(true), 0);
      return;
    }
    // Setelah prefill selesai, aktifkan pelacakan dirty
    setDirtyReady(true);
  }, [location]);
  // Jika tidak ada prefill sama sekali, segera aktifkan pelacakan dirty saat mount
  useEffect(() => { if (!location?.state?.editId && !location?.state?.payload) setDirtyReady(true); }, []);

  // Tandai form kotor saat ada perubahan (setelah ready)
  useEffect(() => {
    if (!dirtyReady) return;
    // Cek apakah ada data terisi (tidak kosong)
    const hasData = 
      (lembar && lembar.trim()) ||
      (buktiKas && buktiKas.trim()) ||
      (kodeRek && kodeRek.trim()) ||
      (terimaDari && terimaDari.trim()) ||
      (untukPembayaran && untukPembayaran.trim()) ||
      notaNumber > 0 ||
      pph21Rate > 0 || pph22Rate > 0 || pph23Rate > 0 || ppnRate > 0 || padRate > 0 ||
      (penggunaNama && penggunaNama.trim()) ||
      (penggunaNip && penggunaNip.trim()) ||
      (pptkNama && pptkNama.trim()) ||
      (pptkNip && pptkNip.trim()) ||
      (bendaharaNama && bendaharaNama.trim()) ||
      (bendaharaNip && bendaharaNip.trim()) ||
      (penerimaNama && penerimaNama.trim());
    
    if (hasData) {
      setUnsaved(true);
      try { window.localStorage.setItem('kwitansi_dirty','1'); } catch {}
    } else {
      setUnsaved(false);
      try { window.localStorage.setItem('kwitansi_dirty','0'); } catch {}
    }
  }, [dirtyReady, lembar, buktiKas, kodeRek, terimaDari, untukPembayaran, nota, pph21Rate, pph22Rate, pph23Rate, ppnRate, padRate, penggunaNama, penggunaNip, pptkNama, pptkNip, bendaharaNama, bendaharaNip, penerimaNama]);

  // Peringatan saat refresh/close tab (native beforeunload)
  useEffect(() => {
    if (!unsaved) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsaved]);

  // Intersep klik Link internal (SPA) bila ada perubahan belum disimpan
  useEffect(() => {
    if (!unsaved) return;
    const onClick = (e) => {
      let el = e.target;
      while (el && el !== document && el.tagName !== 'A') el = el.parentElement;
      if (!el || el.tagName !== 'A') return;
      const href = el.getAttribute('href');
      const target = el.getAttribute('target');
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!href || href.startsWith('http') || target === '_blank') return;
      if (href.startsWith('#')) return;
      e.preventDefault();
      setNextHref(href);
      setConfirmOpen(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [unsaved]);

  // helper to format number with thousand separators (no currency sign yet)
  const formatNumber = (val) => {
    if (val === '' || val === null || isNaN(val)) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  // parse input that may contain dots/commas
  const parseNumeric = (raw) => {
    if (raw === '' || raw === null) return 0;
    const cleaned = String(raw).replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const previewData = {
    lembar,
    buktiKas,
    kodeRek,
    terimaDari,
  uangSebanyak: uangSebanyakAuto,
    untukPembayaran,
    uraian,
    notaPembayaran: notaNumber,
  pph21: pph21Amount,
  pph22: pph22Amount,
  pph23: pph23Amount,
  ppn: ppnAmount,
  pad: padAmount,
    jumlahDiterimakan,
    tanggal: new Date().toLocaleDateString('id-ID'),
    // pass signature values to preview
    penggunaNama,
    penggunaNip,
    pptkNama,
    pptkNip,
    bendaharaNama,
    bendaharaNip,
    penerimaNama
  };

  // Print setup
  const printRef = useRef(null);
  const { printNode } = usePrint({ page: 'A4', orientation: 'portrait', margin: '0' });
  const handlePrint = () => {
    if (printRef.current) {
      // Samakan layout print dengan PDF: toggle kelas PDF-only sebelum print
      const frames = printRef.current.querySelectorAll('.doc-frame');
      frames.forEach(el => {
        el.classList.add('pdf-shift');
        if (el.classList.contains('dual')) {
          el.classList.add('pdf-gap-10');
        }
        el.classList.add('pdf-sign-gap-15');
        el.classList.add('pdf-noborder');
        el.classList.add('pdf-title-up-5');
  el.classList.add('pdf-trim-bottom');
  // PRINT-only: geser semua isi ke kanan 10mm
  el.classList.add('print-shift-right-10');
        // PRINT-only: geser semua isi ke bawah 3mm
        el.classList.add('print-shift-down-3');
      });
      // Cetak node tersembunyi dengan pengaturan A4
      printNode(printRef.current, {
        title: 'Kwitansi Honor',
        // Pembatas tinggi halaman langsung via extraCss agar tidak melewati 1 halaman A4
        extraCss: `
          /* Limit content to one A4 page and clip any overflow */
          html, body { max-height: 297mm; overflow: hidden; }
          /* Ensure the document frame never exceeds one page */
          .doc-frame, .doc-frame.dual {
            max-height: 297mm;
            box-sizing: border-box;
            overflow: hidden;
          }
        `
      }).finally(() => {
        // Bersihkan kelas sementara agar tidak mempengaruhi UI
        frames.forEach(el => {
          el.classList.remove('pdf-shift');
          el.classList.remove('pdf-gap-10');
          el.classList.remove('pdf-sign-gap-15');
          el.classList.remove('pdf-noborder');
          el.classList.remove('pdf-title-up-5');
          el.classList.remove('pdf-trim-bottom');
          el.classList.remove('print-shift-right-10');
          el.classList.remove('print-shift-down-3');
        });
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (printRef.current) {
      try {
        // Add temporary classes for PDF only (no scaling)
        const frames = printRef.current.querySelectorAll('.doc-frame');
        frames.forEach(el => {
          el.classList.add('pdf-shift');
          if (el.classList.contains('dual')) {
            el.classList.add('pdf-gap-10');
          }
          // PDF-only: force signature gap to 15mm
          el.classList.add('pdf-sign-gap-15');
          // PDF-only: remove frame border to avoid bottom line
          el.classList.add('pdf-noborder');
          // PDF-only: move KWITANSI title up by 5mm
          el.classList.add('pdf-title-up-5');
          // PDF-only: bring title down by 5mm relative to print (net +5mm vs base)
          el.classList.add('pdf-title-down-5');
          // PDF-only: shift KWITANSI title 2mm to the left
          el.classList.add('pdf-title-left-2');
          // PDF/PRINT-only: trim bottom padding to remove extra space after copy 2
          el.classList.add('pdf-trim-bottom');
          // PDF-only: shift the top-right block 10mm to the left
          el.classList.add('pdf-top-right-left-10');
        });
        await downloadElementAsPdf(printRef.current, {
          filename: 'kwitansi-honor.pdf',
          page: 'a4',
          orientation: 'portrait',
          margin: 0,
          scale: 2,
        });
        // Clean up the temporary classes
        frames.forEach(el => {
          el.classList.remove('pdf-shift');
      el.classList.remove('pdf-gap-10');
      el.classList.remove('pdf-sign-gap-15'); // Remove 15mm gap
      el.classList.remove('pdf-noborder');
      el.classList.remove('pdf-title-up-5');
      el.classList.remove('pdf-title-down-5');
      el.classList.remove('pdf-title-left-2');
      el.classList.remove('pdf-trim-bottom');
      el.classList.remove('pdf-top-right-left-10');
        });
      } catch (e) {
        console.error('Failed to generate PDF:', e);
        // Ensure cleanup on error
        const frames = printRef.current.querySelectorAll('.doc-frame');
        frames.forEach(el => {
          el.classList.remove('pdf-shift');
      el.classList.remove('pdf-gap-10');
      el.classList.remove('pdf-sign-gap-15'); // Remove 15mm gap
      el.classList.remove('pdf-noborder');
      el.classList.remove('pdf-title-up-5');
      el.classList.remove('pdf-title-down-5');
      el.classList.remove('pdf-title-left-2');
      el.classList.remove('pdf-trim-bottom');
      el.classList.remove('pdf-top-right-left-10');
        });
      }
    }
  };

  // Save to Firestore (laporan_honor)
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const handleSave = async () => {
    // Validasi: Terima Dari, Nota Pembayaran, dan Uang Sebanyak (jumlah diterimakan) wajib terisi
    const missingTerima = !String(terimaDari || '').trim();
    const missingNota = !(notaNumber > 0);
    const missingUangSebanyak = !(jumlahDiterimakan > 0);
    if (missingTerima || missingNota || missingUangSebanyak) {
      toast.error('Kwitansi tidak dapat disimpan. Lengkapi Terima Dari, Uang Sebanyak, dan Nota Pembayaran terlebih dahulu.', { title: 'Tidak dapat disimpan' });
      return;
    }
    setSaveMsg("");
    setSaving(true);
    try {
      const docData = {
        type: 'kwitansi-honor',
        // createdAt hanya untuk tambah baru; update pakai updatedAt
        ...(editId ? {} : { createdAt: serverTimestamp() }),
        ...(editId ? { updatedAt: serverTimestamp() } : {}),
        createdBy: auth?.currentUser?.uid || null,
        lembar,
        buktiKas,
        kodeRek,
        terimaDari,
        uangSebanyak,
        untukPembayaran,
        uraian,
  notaPembayaran: notaNumber,
  pph21: pph21Amount,
  pph22: pph22Amount,
  pph23: pph23Amount,
  ppn: ppnAmount,
  pad: padAmount,
  pph21Rate, pph22Rate, pph23Rate, ppnRate, padRate,
        jumlahDiterimakan,
        tanggal: new Date().toISOString(),
        signatures: {
          pengguna: { nama: penggunaNama, nip: penggunaNip },
          pptk: { nama: pptkNama, nip: pptkNip },
          bendahara: { nama: bendaharaNama, nip: bendaharaNip },
          penerima: { nama: penerimaNama },
        },
      };
      const uid = auth?.currentUser?.uid;
      if (!uid) throw new Error('User belum login');
      if (editId) {
        if (editSource === 'legacy') {
          await updateDoc(doc(db, 'laporan_honor', editId), docData);
        } else {
          await updateDoc(doc(db, 'users', uid, 'laporan_honor', editId), docData);
        }
        setSaveMsg('Berhasil diperbarui.');
        toast.success('Data berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'users', uid, 'laporan_honor'), docData);
        setSaveMsg('Berhasil disimpan ke Laporan Honor.');
        toast.success('Berhasil disimpan ke Laporan Honor');
        
        // Reset semua field setelah save berhasil (hanya untuk data baru)
        setLembar("");
        setBuktiKas("");
        setKodeRek("");
        setTerimaDari("");
        setUntukPembayaran("");
        setNota(0);
        setPph21Rate(0);
        setPph22Rate(0);
        setPph23Rate(0);
        setPpnRate(0);
        setPadRate(0);
        setPenggunaNama("");
        setPenggunaNip("");
        setPptkNama("");
        setPptkNip("");
        setBendaharaNama("");
        setBendaharaNip("");
        setPenerimaNama("");
      }
      try { window.localStorage.setItem('kwitansi_dirty','0'); } catch {}
      setUnsaved(false);
    } catch (err) {
      console.error('Gagal simpan:', err);
      setSaveMsg('Gagal menyimpan. Periksa koneksi atau coba lagi.');
      toast.error('Gagal menyimpan. Periksa koneksi atau coba lagi.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  const handleConfirmProceedSave = async () => {
    // Validasi dulu sebelum simpan
    const missingTerima = !String(terimaDari || '').trim();
    const missingNota = !(notaNumber > 0);
    const missingUangSebanyak = !(jumlahDiterimakan > 0);
    
    if (missingTerima || missingNota || missingUangSebanyak) {
      // Tampilkan error dan biarkan popup tetap terbuka
      toast.error('Kwitansi tidak dapat disimpan. Lengkapi Terima Dari, Nota Pembayaran, dan Uang Sebanyak terlebih dahulu.', { title: 'Tidak dapat disimpan' });
      return; // Jangan tutup popup, jangan navigasi
    }

    setSaving(true);
    try {
      await handleSave();
      // Simpan berhasil, lanjut navigasi
      const href = nextHref;
      setConfirmOpen(false);
      setNextHref(null);
      setUnsaved(false);
      if (href) navigate(href);
    } catch (err) {
      // Gagal simpan, popup tetap terbuka
      console.error('Gagal simpan dari popup:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCancel = () => {
    // Tidak simpan, langsung lanjut navigasi
    const href = nextHref;
    setConfirmOpen(false);
    setNextHref(null);
    setUnsaved(false); // reset flag agar tidak loop
    if (href) navigate(href);
  };

  return (
    <div className="dashboard-wrapper">
      <Header />
      <div className="container py-3">
        <div className="kwitansi-wrapper">
          <div className="d-flex justify-content-end mb-2 gap-2 flex-wrap">
            <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center" onClick={() => setShowPreview(true)}>
              <EyeIcon className="me-1" /> Preview
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center" onClick={handlePrint}>
              <PrinterIcon className="me-1" /> Print
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center" onClick={handleDownloadPdf}>
              <DownloadIcon className="me-1" /> Download PDF
            </button>
          </div>
          <div className="card shadow-sm">
          <div className="card-header text-center fw-semibold">KWITANSI HONOR</div>
          <div className="card-body pt-3">
            { /* Reverted to simple single-field-per-row layout (user requested) */ }
            {[
              { label: 'Lembar', key: 'lembar', bind: { value: lembar, onChange: (e)=> setLembar(e.target.value) } },
              { label: 'Bukti Kas Nomor', key: 'buktiKas', bind: { value: buktiKas, onChange: (e)=> setBuktiKas(e.target.value) } },
              { label: 'Kode Rekening', key: 'kodeRek', bind: { value: kodeRek, onChange: (e)=> setKodeRek(e.target.value) } },
              { heading: true, label: 'KWITANSI' },
              { label: 'Terima Dari', key: 'terimaDari', bind: { value: terimaDari, onChange: (e)=> setTerimaDari(e.target.value) } },
              { label: 'Uang Sebanyak', key: 'uangSebanyak', bind: { value: uangSebanyakAuto } },
              { label: 'Untuk pembayaran', key: 'untukPembayaran', bind: { value: untukPembayaran, onChange: (e)=> setUntukPembayaran(e.target.value) } },
              { label: 'Uraian', noInput: true, key: 'uraian' },
              { label: 'Nota Pembayaran', key: 'notaPembayaran', type: 'numberCurrency' },
              { label: 'PPh 21', key: 'pph21', type: 'tax' },
              { label: 'PPh 22', key: 'pph22', type: 'tax' },
              { label: 'PPh 23', key: 'pph23', type: 'tax' },
              { label: 'PPN', key: 'ppn', type: 'tax' },
              { label: 'PAD', key: 'pad', type: 'tax' },
              { label: 'Jumlah diterimakan', key: 'jumlahDiterimakan', type: 'calculated' }
            ].map((f, idx) => {
              if (f.heading) {
                return (
                  <div key={idx} className="text-center fw-semibold my-2 kwitansi-subtitle">KWITANSI</div>
                );
              }
              return (
                <div className="kw-row mb-3" key={idx}>
                  <div className="kw-label-cell">
                    <label className="form-label small mb-0">{f.label}</label>
                  </div>
                  <div className="kw-input-cell">
                    {f.noInput && <div className="text-muted small fst-italic">&nbsp;</div>}
                    {!f.noInput && f.type === 'numberCurrency' && f.key === 'notaPembayaran' && (
                      <input
                        className="form-control form-control-sm"
                        value={nota === 0 ? '' : formatNumber(notaNumber)}
                        onChange={(e) => setNota(parseNumeric(e.target.value))}
                        inputMode="numeric"
                        placeholder="0"
                      />
                    )}
                    {!f.noInput && f.type === 'tax' && (
                      <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                        <div className="d-flex align-items-center" style={{ maxWidth: '110px' }}>
                          <input
                            type="number"
                            className="form-control form-control-sm text-end"
                            min="0"
                            step="0.5"
                            value={{
                              pph21: pph21Rate,
                              pph22: pph22Rate,
                              pph23: pph23Rate,
                              ppn: ppnRate,
                              pad: padRate
                            }[f.key]}
                            onChange={(e)=>{
                              const val = Number(e.target.value) || 0;
                              if (f.key==='pph21') setPph21Rate(val);
                              else if (f.key==='pph22') setPph22Rate(val);
                              else if (f.key==='pph23') setPph23Rate(val);
                              else if (f.key==='ppn') setPpnRate(val);
                              else if (f.key==='pad') setPadRate(val);
                            }}
                            
                          />
                          <span className="ms-1 small">%</span>
                        </div>
                        <input
                          className={`form-control form-control-sm text-end kw-readonly`}
                          readOnly
                          style={{ maxWidth: '140px' }}
                          value={
                            f.key==='pph21' ? (pph21Amount ? formatNumber(pph21Amount) : '') :
                            f.key==='pph22' ? (pph22Amount ? formatNumber(pph22Amount) : '') :
                            f.key==='pph23' ? (pph23Amount ? formatNumber(pph23Amount) : '') :
                            f.key==='ppn' ? (ppnAmount ? formatNumber(ppnAmount) : '') :
                            f.key==='pad' ? (padAmount ? formatNumber(padAmount) : '') : ''
                          }
                        />
                      </div>
                    )}
                    {!f.noInput && f.type === 'calculated' && f.key === 'jumlahDiterimakan' && (
                      <input
                        className="form-control form-control-sm kw-readonly"
                        value={jumlahDiterimakan ? formatNumber(jumlahDiterimakan) : ''}
                        readOnly
                      />
                    )}
                    {!f.noInput && !f.type && (
                      f.key === 'uangSebanyak' ? (
                        <input
                          className="form-control form-control-sm kw-readonly"
                          value={uangSebanyakAuto}
                          readOnly
                        />
                      ) : (
                        <input className="form-control form-control-sm" {...(f.bind || {})} />
                      )
                    )}
                  </div>
                </div>
              );
            })}
            <div className="border-top pt-3 mt-3">
              <p className="small text-muted mb-2">Tanda Tangan</p>
              {[
                'Pengguna Anggaran',
                'PPTK',
                'Bendahara',
                'Penerima'
              ].map((role, idx) => {
                // map role to state binders
                const isPenerima = role === 'Penerima';
                const binds = {
                  'Pengguna Anggaran': {
                    nama: { value: penggunaNama, onChange: (e)=> setPenggunaNama(e.target.value) },
                    nip: { value: penggunaNip, onChange: (e)=> setPenggunaNip(e.target.value) }
                  },
                  'PPTK': {
                    nama: { value: pptkNama, onChange: (e)=> setPptkNama(e.target.value) },
                    nip: { value: pptkNip, onChange: (e)=> setPptkNip(e.target.value) }
                  },
                  'Bendahara': {
                    nama: { value: bendaharaNama, onChange: (e)=> setBendaharaNama(e.target.value) },
                    nip: { value: bendaharaNip, onChange: (e)=> setBendaharaNip(e.target.value) }
                  },
                  'Penerima': {
                    nama: { value: penerimaNama, onChange: (e)=> setPenerimaNama(e.target.value) }
                  }
                }[role];
                return (
                  <div className="kw-row mb-3" key={idx}>
                    <div className="kw-label-cell">
                      <span className="small fw-semibold signature-role-label">{role}</span>
                    </div>
                    {isPenerima ? (
                      <div className="kw-input-cell">
                        <input className="form-control form-control-sm mb-0" placeholder={`Nama ${role}`} {...binds.nama} />
                      </div>
                    ) : (
                      <div className="kw-input-cell">
                        <div className="mb-2">
                          <input className="form-control form-control-sm" placeholder={`Nama ${role}`} {...binds.nama} />
                        </div>
                        <div>
                          <input className="form-control form-control-sm" placeholder={`NIP ${role}`} {...binds.nip} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </div>
          {/* Save outside the card at the bottom */}
          <div className="d-flex justify-content-end mt-3">
            <button type="button" className="btn btn-secondary btn-sm d-inline-flex align-items-center" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan…' : (editId ? 'Update' : 'Save')}
            </button>
          </div>
          {saveMsg && (<div className="mt-2 small text-end">{saveMsg}</div>)}
        </div>
      </div>
      {/* Hidden print content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} aria-hidden="true">
        <div ref={printRef}>
          <ReceiptDocument data={previewData} />
        </div>
      </div>
      {showPreview && (
        <PreviewModal data={previewData} onClose={() => setShowPreview(false)} />
      )}

      {/* Modal konfirmasi simpan perubahan */}
      {confirmOpen && (
        <>
          <div className="modal-backdrop show"></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered" role="document" style={{maxWidth: '320px', width: '320px'}}>
              <div className="modal-content" style={{borderRadius: '8px'}}>
                <div className="modal-header" style={{backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6', padding: '12px 16px'}}>
                  <h5 className="modal-title" style={{color: '#495057', fontSize: '1rem'}}>Save Changes?</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={handleConfirmCancel} style={{fontSize: '0.75rem'}}></button>
                </div>
                <div className="modal-body" style={{backgroundColor: '#fff', color: '#212529', padding: '20px 16px', textAlign: 'center'}}>
                  <p style={{margin: 0, fontSize: '0.9rem'}}>Do you want to save your changes?</p>
                </div>
                <div className="modal-footer" style={{backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', padding: '12px 16px', justifyContent: 'center', gap: '10px'}}>
                  <button type="button" className="btn" style={{backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '8px 24px', fontSize: '0.9rem'}} onClick={handleConfirmCancel}>No</button>
                  <button type="button" className="btn" style={{backgroundColor: '#495057', color: '#fff', border: 'none', padding: '8px 24px', fontSize: '0.9rem'}} onClick={handleConfirmProceedSave}>Yes</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Reuse simplified eye icon (open only)
function EyeIcon({ className = "me-1" }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon({ className = "me-1" }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PrinterIcon({ className = "me-1" }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
      <path d="M18 18H6" />
    </svg>
  );
}

export default KwitansiHonor;

