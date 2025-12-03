import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./layout/Header";
import PreviewModal from "./PreviewModal";
import ReceiptDocument from "./Receipt";
import usePrint from "../hooks/usePrint";
import downloadElementAsPdf from "../lib/pdf";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { useToast } from "./ui/ToastProvider";
import terbilang from "../lib/terbilang";
import "./KwitansiHonor.css";

function KwitansiJasa() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Edit state
  const [editId, setEditId] = useState(null);

  // Fields (disamakan dengan Kwitansi Honor)
  const [lembar, setLembar] = useState("");
  const [buktiKas, setBuktiKas] = useState("");
  const [kodeRek, setKodeRek] = useState("");
  const [terimaDari, setTerimaDari] = useState("");
  const [untukPembayaran, setUntukPembayaran] = useState("");
  const [uraian] = useState("");
  const [nota, setNota] = useState(0);
  const [useMode, setUseMode] = useState('nota'); // 'nota' atau 'dpp'
  const [taxMode, setTaxMode] = useState('kurang'); // 'tambah' atau 'kurang'
  // Tax rates (%) and computed amounts
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
  const [penggunaNama, setPenggunaNama] = useState("");
  const [penggunaNip, setPenggunaNip] = useState("");
  const [pptkNama, setPptkNama] = useState("");
  const [pptkNip, setPptkNip] = useState("");
  const [bendaharaNama, setBendaharaNama] = useState("");
  const [bendaharaNip, setBendaharaNip] = useState("");
  const [penerimaNama, setPenerimaNama] = useState("");

  const notaNumber = Number(nota) || 0;

  // Hitung DPP otomatis: DPP = Nota Pembayaran * 100/111
  const calculateDpp = () => {
    return Math.round(notaNumber * 100 / 111);
  };

  // Base untuk perhitungan pajak: gunakan DPP jika mode DPP, atau Nota jika mode Nota
  const taxBase = useMode === 'dpp' ? calculateDpp() : notaNumber;

  // Pajak berbasis DPP atau Nota Pembayaran tergantung mode
  const pph21Amount = Math.round(taxBase * (Number(pph21Rate) || 0) / 100);
  const pph22Amount = Math.round(taxBase * (Number(pph22Rate) || 0) / 100);
  const pph23Amount = Math.round(taxBase * (Number(pph23Rate) || 0) / 100);
  const ppnAmount = Math.round(taxBase * (Number(ppnRate) || 0) / 100);
  const padAmount = Math.round(taxBase * (Number(padRate) || 0) / 100);
  // Jumlah Diterimakan = Base ditambah atau dikurangi pajak sesuai taxMode
  const totalPajak = pph21Amount + pph22Amount + pph23Amount + ppnAmount + padAmount;
  const jumlahDiterimakan = taxMode === 'tambah' ? taxBase + totalPajak : taxBase - totalPajak;
  const uangSebanyakAuto = jumlahDiterimakan ? `${terbilang(jumlahDiterimakan)} Rupiah` : "";

  // Hapus logika pph21 lama (tidak digunakan lagi)

  // Prefill/edit from Dashboard state (support prefill.id as editId)
  useEffect(() => {
    const st = location?.state;
    const prefill = st?.payload || st?.prefill;
    if (!prefill) {
      // Tidak ada prefill: masuk mode BUAT BARU -> reset form
      setDirtyReady(false);
      setEditId(null);
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
      try { window.localStorage.setItem('kwitansi_dirty','0'); } catch {}
      setTimeout(() => setDirtyReady(true), 0);
      return;
    }
    if (prefill.id) setEditId(prefill.id);
    setLembar(prefill.lembar || "");
    setBuktiKas(prefill.buktiKas || prefill.buktiKasNomor || "");
    setKodeRek(prefill.kodeRek || "");
    setTerimaDari(prefill.terimaDari || prefill.penerima || prefill.customerName || "");
    setUntukPembayaran(prefill.untukPembayaran || prefill.notes || "");
  const baseNota = Number(prefill.notaPembayaran ?? prefill.total ?? 0) || 0;
  setNota(baseNota);
  // Prefill rates if saved; else try to infer from amounts based on Nota
  const infer = (amt) => (baseNota > 0 ? Math.round((Number(amt||0) / baseNota) * 10000) / 100 : 0);
    setPph21Rate(Number(prefill.pph21Rate ?? infer(prefill.pph21)) || 0);
    setPph22Rate(Number(prefill.pph22Rate ?? infer(prefill.pph22)) || 0);
    setPph23Rate(Number(prefill.pph23Rate ?? infer(prefill.pph23)) || 0);
    setPpnRate(Number(prefill.ppnRate ?? infer(prefill.ppn)) || 0);
    setPadRate(Number(prefill.padRate ?? infer(prefill.pad)) || 0);
    const sig = prefill.signatures || {};
    setPenggunaNama(sig.pengguna?.nama || prefill.penggunaAnggaran || "");
    setPenggunaNip(sig.pengguna?.nip || prefill.nipPenggunaAnggaran || "");
    setPptkNama(sig.pptk?.nama || prefill.namaPptk || "");
    setPptkNip(sig.pptk?.nip || prefill.nipPptk || "");
    setBendaharaNama(sig.bendahara?.nama || prefill.namaBendahara || "");
    setBendaharaNip(sig.bendahara?.nip || prefill.nipBendahara || "");
    setPenerimaNama(sig.penerima?.nama || prefill.penerima || prefill.customerName || "");
    setDirtyReady(true);
  }, [location]);
  useEffect(() => { if (!location?.state?.payload && !location?.state?.prefill) setDirtyReady(true); }, []);

  // Tandai form kotor saat ada perubahan (setelah ready)
  useEffect(() => {
    if (!dirtyReady) return;
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

  const formatNumber = (val) => {
    if (val === '' || val === null || isNaN(val)) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };
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
    useMode,
    notaPembayaran: useMode === 'nota' ? notaNumber : 0,
    dpp: useMode === 'dpp' ? calculateDpp() : 0,
  // pph21 tidak ditampilkan di laporan Jasa, tapi disediakan di form
  pph21: pph21Amount,
  pph22: pph22Amount,
  pph23: pph23Amount,
  ppn: ppnAmount,
  pad: padAmount,
    jumlahDiterimakan,
    tanggal: new Date().toLocaleDateString('id-ID'),
    penggunaNama,
    penggunaNip,
    pptkNama,
    pptkNip,
    bendaharaNama,
    bendaharaNip,
    penerimaNama,
  };

  // Print/PDF (reuse from Honor)
  const printRef = useRef(null);
  const { printNode } = usePrint({ page: 'A4', orientation: 'portrait', margin: '0' });
  const handlePrint = () => {
    if (!printRef.current) return;
    const frames = printRef.current.querySelectorAll('.doc-frame');
    frames.forEach(el => {
      el.classList.add('pdf-shift');
      if (el.classList.contains('dual')) el.classList.add('pdf-gap-10');
      el.classList.add('pdf-sign-gap-15');
      el.classList.add('pdf-noborder');
      el.classList.add('pdf-title-up-5');
      el.classList.add('pdf-trim-bottom');
      el.classList.add('print-shift-right-10');
      el.classList.add('print-shift-down-3');
    });
    printNode(printRef.current, {
      title: 'Kwitansi Jasa',
      extraCss: `html, body { max-height: 297mm; overflow: hidden; }
      .doc-frame, .doc-frame.dual { max-height: 297mm; box-sizing: border-box; overflow: hidden; }`
    }).finally(() => {
      frames.forEach(el => {
        el.classList.remove('pdf-shift','pdf-gap-10','pdf-sign-gap-15','pdf-noborder','pdf-title-up-5','pdf-trim-bottom','print-shift-right-10','print-shift-down-3');
      });
    });
  };
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const frames = printRef.current.querySelectorAll('.doc-frame');
    try {
      frames.forEach(el => {
        el.classList.add('pdf-shift');
        if (el.classList.contains('dual')) el.classList.add('pdf-gap-10');
        el.classList.add('pdf-sign-gap-15','pdf-noborder','pdf-title-up-5','pdf-title-down-5','pdf-title-left-2','pdf-trim-bottom','pdf-top-right-left-10');
      });
      await downloadElementAsPdf(printRef.current, { filename: 'kwitansi-jasa.pdf', page:'a4', orientation:'portrait', margin:0, scale:2 });
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      frames.forEach(el => {
        el.classList.remove('pdf-shift','pdf-gap-10','pdf-sign-gap-15','pdf-noborder','pdf-title-up-5','pdf-title-left-2','pdf-trim-bottom','pdf-top-right-left-10');
        el.classList.remove('pdf-title-down-5');
      });
    }
  };

  // Save to Firestore (laporan_jasa)
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    // Validasi: Terima Dari, Nota Pembayaran, dan Uang Sebanyak (jumlah diterimakan) wajib terisi
    const missingTerima = !String(terimaDari || '').trim();
    const missingNota = !(notaNumber > 0);
    const missingUangSebanyak = !(jumlahDiterimakan > 0);
    if (missingTerima || missingNota || missingUangSebanyak) {
      toast.error('Kwitansi tidak dapat disimpan. Lengkapi Terima Dari, Uang Sebanyak, dan Nota Pembayaran terlebih dahulu.', { title: 'Tidak dapat disimpan' });
      return;
    }
    setSaving(true);
    try {
      const uid = auth?.currentUser?.uid;
      if (!uid) throw new Error('User belum login');
      const docData = {
        type: 'kwitansi-jasa',
        ...(editId ? {} : { createdAt: serverTimestamp() }),
        ...(editId ? { updatedAt: serverTimestamp() } : {}),
        createdBy: uid,
        lembar,
        buktiKas,
        kodeRek,
        terimaDari,
        uangSebanyak: uangSebanyakAuto,
        untukPembayaran,
        uraian,
    useMode,
    taxMode,
    notaPembayaran: notaNumber,
    dpp: Number(dpp),
  // store both rates and computed amounts
  pph21: pph21Amount,
  pph22: pph22Amount,
  pph23: pph23Amount,
  ppn: ppnAmount,
  pad: padAmount,
  pph21Rate,
  pph22Rate,
  pph23Rate,
  ppnRate,
  padRate,
        jumlahDiterimakan,
        tanggal: new Date().toISOString(),
        signatures: {
          pengguna: { nama: penggunaNama, nip: penggunaNip },
          pptk: { nama: pptkNama, nip: pptkNip },
          bendahara: { nama: bendaharaNama, nip: bendaharaNip },
          penerima: { nama: penerimaNama },
        },
      };
      if (editId) {
        await updateDoc(doc(db, 'users', uid, 'laporan_jasa', editId), docData);
        toast.success('Data Jasa berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'users', uid, 'laporan_jasa'), docData);
        toast.success('Berhasil disimpan ke Laporan Jasa');
      }
      try { window.localStorage.setItem('kwitansi_dirty','0'); } catch {}
      setUnsaved(false);
      // Reset form fields after save
      setLembar("");
      setBuktiKas("");
      setKodeRek("");
      setTerimaDari("");
      setUntukPembayaran("");
      setNota(0);
      setUseMode('nota');
      setTaxMode('kurang');
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
    } catch (err) {
      console.error('Gagal menyimpan:', err);
      toast.error('Gagal menyimpan. Periksa koneksi atau coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmProceedSave = async () => {
    // Validasi dulu sebelum simpan
    const missingTerima = !String(terimaDari || '').trim();
    const missingNota = !(notaNumber > 0);
    const missingUangSebanyak = !(jumlahDiterimakan > 0);
    
    if (missingTerima || missingNota || missingUangSebanyak) {
      toast.error('Kwitansi tidak dapat disimpan. Lengkapi Terima Dari, Nota Pembayaran, dan Uang Sebanyak terlebih dahulu.', { title: 'Tidak dapat disimpan' });
      return;
    }

    setSaving(true);
    try {
      await handleSave();
      const href = nextHref;
      setConfirmOpen(false);
      setNextHref(null);
      setUnsaved(false);
      if (href) navigate(href);
    } catch (err) {
      console.error('Gagal simpan dari popup:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCancel = () => {
    const href = nextHref;
    setConfirmOpen(false);
    setNextHref(null);
    setUnsaved(false);
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
            <div className="card-header text-center fw-semibold">KWITANSI JASA</div>
            <div className="card-body pt-3">
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
                { label: '', key: 'dppButton', type: 'dppButton' },
                { label: 'DPP', key: 'dpp', type: 'dppDisplay', showIf: useMode === 'dpp' },
                { label: 'PPh 21', key: 'pph21', type: 'tax' },
                { label: 'PPh 22', key: 'pph22', type: 'tax' },
                { label: 'PPh 23', key: 'pph23', type: 'tax' },
                { label: 'PPN', key: 'ppn', type: 'tax' },
                { label: 'PAD', key: 'pad', type: 'tax' },
                { label: 'Pajak', key: 'taxModeButton', type: 'taxModeButton' },
                { label: 'Jumlah diterimakan', key: 'jumlahDiterimakan', type: 'calculated' }
              ].map((f, idx) => {
                if (f.heading) return (<div key={idx} className="text-center fw-semibold my-2 kwitansi-subtitle">KWITANSI</div>);
                if (f.showIf === false) return null;
                return (
                  <div className="kw-row mb-3" key={idx}>
                    <div className="kw-label-cell">
                      <label className="form-label small mb-0">{f.label}</label>
                    </div>
                    <div className="kw-input-cell">
                      {f.noInput && <div className="text-muted small fst-italic">&nbsp;</div>}
                      {f.type === 'dppButton' && (
                        <button
                          type="button"
                          className={`btn btn-sm ${useMode === 'dpp' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                          onClick={() => setUseMode(useMode === 'dpp' ? 'nota' : 'dpp')}
                          disabled={!notaNumber || notaNumber === 0}
                        >
                          {useMode === 'dpp' ? '- Hapus DPP' : '+ Gunakan DPP'}
                        </button>
                      )}
                      {!f.noInput && f.type === 'numberCurrency' && f.key === 'notaPembayaran' && (
                        <input className="form-control form-control-sm" value={nota === 0 ? '' : formatNumber(notaNumber)} onChange={(e)=> setNota(parseNumeric(e.target.value))} inputMode="numeric" placeholder="0" />
                      )}
                      {f.type === 'dppDisplay' && (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={calculateDpp().toLocaleString('id-ID')}
                          disabled
                          style={{ backgroundColor: '#f8f9fa', fontWeight: '600' }}
                        />
                      )}
                      {f.type === 'taxModeButton' && (
                        <div className="btn-group w-100" role="group">
                          <button
                            type="button"
                            className={`btn btn-sm ${taxMode === 'kurang' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                            onClick={() => setTaxMode('kurang')}
                          >
                            Dikurangi Pajak
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${taxMode === 'tambah' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                            onClick={() => setTaxMode('tambah')}
                          >
                            Ditambah Pajak
                          </button>
                        </div>
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
                            className="form-control form-control-sm text-end kw-readonly"
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
                        <input className="form-control form-control-sm kw-readonly" value={jumlahDiterimakan ? formatNumber(jumlahDiterimakan) : ''} readOnly />
                      )}
                      {!f.noInput && !f.type && (
                        f.key === 'uangSebanyak' ? (
                          <input className="form-control form-control-sm kw-readonly" value={uangSebanyakAuto} readOnly />
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
                {['Pengguna Anggaran','PPTK','Bendahara','Penerima'].map((role, idx) => {
                  const isPenerima = role === 'Penerima';
                  const binds = {
                    'Pengguna Anggaran': { nama: { value: penggunaNama, onChange: (e)=> setPenggunaNama(e.target.value) }, nip: { value: penggunaNip, onChange: (e)=> setPenggunaNip(e.target.value) } },
                    'PPTK': { nama: { value: pptkNama, onChange: (e)=> setPptkNama(e.target.value) }, nip: { value: pptkNip, onChange: (e)=> setPptkNip(e.target.value) } },
                    'Bendahara': { nama: { value: bendaharaNama, onChange: (e)=> setBendaharaNama(e.target.value) }, nip: { value: bendaharaNip, onChange: (e)=> setBendaharaNip(e.target.value) } },
                    'Penerima': { nama: { value: penerimaNama, onChange: (e)=> setPenerimaNama(e.target.value) } }
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
          <div className="d-flex justify-content-end mt-3">
            <button type="button" className="btn btn-secondary btn-sm d-inline-flex align-items-center" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan…' : (editId ? 'Update' : 'Save')}
            </button>
          </div>
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

export default KwitansiJasa;
