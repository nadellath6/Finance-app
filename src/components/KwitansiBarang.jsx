import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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

function KwitansiBarang() {
  const toast = useToast();
  const location = useLocation();

  const [editId, setEditId] = useState(null);
  const [lembar, setLembar] = useState("");
  const [buktiKas, setBuktiKas] = useState("");
  const [kodeRek, setKodeRek] = useState("");
  const [terimaDari, setTerimaDari] = useState("");
  const [untukPembayaran, setUntukPembayaran] = useState("");
  const [uraian] = useState("");
  const [nota, setNota] = useState(0);
  // Tax rates (%) for auto-calculation
  const [pph21Rate, setPph21Rate] = useState(0);
  const [pph22Rate, setPph22Rate] = useState(0);
  const [pph23Rate, setPph23Rate] = useState(0);
  const [ppnRate, setPpnRate] = useState(0);
  const [padRate, setPadRate] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [penggunaNama, setPenggunaNama] = useState("");
  const [penggunaNip, setPenggunaNip] = useState("");
  const [pptkNama, setPptkNama] = useState("");
  const [pptkNip, setPptkNip] = useState("");
  const [bendaharaNama, setBendaharaNama] = useState("");
  const [bendaharaNip, setBendaharaNip] = useState("");
  const [penerimaNama, setPenerimaNama] = useState("");
  const [dirtyReady, setDirtyReady] = useState(false);

  const notaNumber = Number(nota) || 0;
  const pph21Amount = Math.round(notaNumber * (Number(pph21Rate)||0) / 100);
  const pph22Amount = Math.round(notaNumber * (Number(pph22Rate)||0) / 100);
  const pph23Amount = Math.round(notaNumber * (Number(pph23Rate)||0) / 100);
  const ppnAmount = Math.round(notaNumber * (Number(ppnRate)||0) / 100);
  const padAmount = Math.round(notaNumber * (Number(padRate)||0) / 100);
  // Jumlah Diterimakan = Nota Pembayaran dikurangi seluruh pajak yang diinput (PPh21 selalu bisa dipakai)
  const jumlahDiterimakan = notaNumber - (pph21Amount + pph22Amount + pph23Amount + ppnAmount + padAmount);
  const uangSebanyakAuto = jumlahDiterimakan ? `${terbilang(jumlahDiterimakan)} Rupiah` : "";

  useEffect(() => { if (notaNumber === 0) { setPph21Rate(0); setPph22Rate(0); setPph23Rate(0); setPpnRate(0); setPadRate(0); } }, [notaNumber]);

  useEffect(() => {
    const st = location?.state;
    const prefill = st?.payload || st?.prefill;
    if (!prefill) {
      // Tidak ada prefill: mode BUAT BARU, reset form & edit state
      setDirtyReady(false);
      setEditId(null);
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
      setTimeout(() => setDirtyReady(true), 0);
      return;
    }
    if (prefill.id) setEditId(prefill.id);
    setLembar(prefill.lembar || "");
    setBuktiKas(prefill.buktiKas || prefill.buktiKasNomor || "");
    setKodeRek(prefill.kodeRek || "");
    setTerimaDari(prefill.terimaDari || prefill.penerima || prefill.customerName || "");
    setUntukPembayaran(prefill.untukPembayaran || prefill.notes || "");
  setNota(Number(prefill.notaPembayaran ?? prefill.total ?? 0) || 0);
  const _nota = Number(prefill.notaPembayaran ?? prefill.total ?? 0) || 0;
  const infer = (amt) => (_nota>0 ? Math.round((Number(amt||0)/_nota)*10000)/100 : 0);
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

  useEffect(() => {
    if (!dirtyReady) return;
    try { window.localStorage.setItem('kwitansi_dirty','1'); } catch {}
  }, [dirtyReady, lembar, buktiKas, kodeRek, terimaDari, untukPembayaran, nota, pph21Rate, pph22Rate, pph23Rate, ppnRate, padRate, penggunaNama, penggunaNip, pptkNama, pptkNip, bendaharaNama, bendaharaNip, penerimaNama]);

  const formatNumber = (val) => { if (val === '' || val === null || isNaN(val)) return ''; return new Intl.NumberFormat('id-ID').format(val); };
  const parseNumeric = (raw) => { if (raw === '' || raw === null) return 0; const cleaned = String(raw).replace(/[^0-9]/g, ''); return cleaned ? parseInt(cleaned, 10) : 0; };

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
    penggunaNama,
    penggunaNip,
    pptkNama,
    pptkNip,
    bendaharaNama,
    bendaharaNip,
    penerimaNama,
  };

  const printRef = useRef(null);
  const { printNode } = usePrint({ page: 'A4', orientation: 'portrait', margin: '0' });
  const handlePrint = () => {
    if (!printRef.current) return;
    const frames = printRef.current.querySelectorAll('.doc-frame');
    frames.forEach(el => {
      el.classList.add('pdf-shift');
      if (el.classList.contains('dual')) el.classList.add('pdf-gap-10');
      el.classList.add('pdf-sign-gap-15','pdf-noborder','pdf-title-up-5','pdf-trim-bottom','print-shift-right-10','print-shift-down-3');
    });
    printNode(printRef.current, {
      title: 'Kwitansi Barang',
      extraCss: `html, body { max-height: 297mm; overflow: hidden; }
      .doc-frame, .doc-frame.dual { max-height: 297mm; box-sizing: border-box; overflow: hidden; }`
    }).finally(() => {
      frames.forEach(el => el.classList.remove('pdf-shift','pdf-gap-10','pdf-sign-gap-15','pdf-noborder','pdf-title-up-5','pdf-trim-bottom','print-shift-right-10','print-shift-down-3'));
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
      await downloadElementAsPdf(printRef.current, { filename: 'kwitansi-barang.pdf', page:'a4', orientation:'portrait', margin:0, scale:2 });
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
  frames.forEach(el => el.classList.remove('pdf-shift','pdf-gap-10','pdf-sign-gap-15','pdf-noborder','pdf-title-up-5','pdf-title-down-5','pdf-title-left-2','pdf-trim-bottom','pdf-top-right-left-10'));
    }
  };

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
      const uid = auth?.currentUser?.uid;
      if (!uid) throw new Error('User belum login');
      const docData = {
        type: 'kwitansi-barang',
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
      if (editId) {
        await updateDoc(doc(db, 'users', uid, 'laporan_barang', editId), docData);
        toast.success('Data Barang berhasil diperbarui');
        setSaveMsg('Berhasil diperbarui.');
      } else {
        await addDoc(collection(db, 'users', uid, 'laporan_barang'), docData);
        toast.success('Berhasil disimpan ke Laporan Barang');
        setSaveMsg('Berhasil disimpan ke Laporan Barang.');
      }
      try { window.localStorage.setItem('kwitansi_dirty','0'); } catch {}
    } catch (err) {
      console.error('Gagal simpan:', err);
      toast.error('Gagal menyimpan. Periksa koneksi atau coba lagi.');
      setSaveMsg('Gagal menyimpan. Periksa koneksi atau coba lagi.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
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
            <div className="card-header text-center fw-semibold">KWITANSI BARANG</div>
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
                { label: 'PPh 21', key: 'pph21', type: 'tax' },
                { label: 'PPh 22', key: 'pph22', type: 'tax' },
                { label: 'PPh 23', key: 'pph23', type: 'tax' },
                { label: 'PPN', key: 'ppn', type: 'tax' },
                { label: 'PAD', key: 'pad', type: 'tax' },
                { label: 'Jumlah diterimakan', key: 'jumlahDiterimakan', type: 'calculated' }
              ].map((f, idx) => {
                if (f.heading) return (<div key={idx} className="text-center fw-semibold my-2 kwitansi-subtitle">KWITANSI</div>);
                return (
                  <div className="kw-row mb-3" key={idx}>
                    <div className="kw-label-cell">
                      <label className="form-label small mb-0">{f.label}</label>
                    </div>
                    <div className="kw-input-cell">
                      {f.noInput && <div className="text-muted small fst-italic">&nbsp;</div>}
                      {!f.noInput && f.type === 'numberCurrency' && f.key === 'notaPembayaran' && (
                        <input className="form-control form-control-sm" value={nota === 0 ? '' : formatNumber(notaNumber)} onChange={(e)=> setNota(parseNumeric(e.target.value))} inputMode="numeric" placeholder="0" />
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
    </div>
  );
}

function EyeIcon({ className = "me-1" }) { return (<svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>); }
function DownloadIcon({ className = "me-1" }) { return (<svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>); }
function PrinterIcon({ className = "me-1" }) { return (<svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /><path d="M18 18H6" /></svg>); }

export default KwitansiBarang;
