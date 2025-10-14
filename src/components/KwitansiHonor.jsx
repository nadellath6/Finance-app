import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import PreviewModal from "./PreviewModal";
import Header from "./layout/Header";
import "./KwitansiHonor.css"; // will trim after Bootstrap migration
import usePrint from "../hooks/usePrint";
import downloadElementAsPdf from "../lib/pdf";
import ReceiptDocument from "./Receipt";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import terbilang from "../lib/terbilang";

function KwitansiHonor() {
  const location = useLocation();
  const [editId, setEditId] = useState(null);
  // Individual field states (will later refactor to single object if needed)
  const [lembar, setLembar] = useState("");
  const [buktiKas, setBuktiKas] = useState("");
  const [kodeRek, setKodeRek] = useState("");
  const [terimaDari, setTerimaDari] = useState("");
  const [uangSebanyak, setUangSebanyak] = useState("");
  const [untukPembayaran, setUntukPembayaran] = useState("");
  const [uraian] = useState(""); // no input currently per requirements
  const [nota, setNota] = useState(0); // Nota Pembayaran numeric value
  const [pph21, setPph21] = useState(0); // PPH21 numeric value
  const [showPreview, setShowPreview] = useState(false);
  // Signature fields
  const [penggunaNama, setPenggunaNama] = useState("");
  const [penggunaNip, setPenggunaNip] = useState("");
  const [pptkNama, setPptkNama] = useState("");
  const [pptkNip, setPptkNip] = useState("");
  const [bendaharaNama, setBendaharaNama] = useState("");
  const [bendaharaNip, setBendaharaNip] = useState("");
  const [penerimaNama, setPenerimaNama] = useState("");
  const notaNumber = Number(nota) || 0;
  const pphNumber = Number(pph21) || 0;
  const pphEnabled = notaNumber > 1000000; // enable only if > 1,000,000
  // Revised per user: Jumlah Diterimakan = Nota Pembayaran + PPH21 (bukan dikurang)
  const jumlahDiterimakan = notaNumber + (pphEnabled ? pphNumber : 0);

  // Auto-convert jumlah diterimakan to words for "Uang Sebanyak"
  const uangSebanyakAuto = jumlahDiterimakan ? `${terbilang(jumlahDiterimakan)} Rupiah` : "";

  // Reset PPH21 when nota becomes 0 (user request)
  useEffect(() => {
    if (notaNumber === 0 && pph21 !== 0) {
      setPph21(0);
    }
  }, [notaNumber, pph21]);

  // Prefill when navigating from LaporanHonor (Edit)
  useEffect(() => {
    const st = location?.state;
    if (st?.editId && st?.payload) {
      setEditId(st.editId);
      const p = st.payload;
      setLembar(p.lembar || "");
      setBuktiKas(p.buktiKas || "");
      setKodeRek(p.kodeRek || "");
      setTerimaDari(p.terimaDari || "");
      setUntukPembayaran(p.untukPembayaran || "");
      setNota(Number(p.notaPembayaran) || 0);
      setPph21(Number(p.pph21) || 0);
      const sig = p.signatures || {};
      setPenggunaNama(sig.pengguna?.nama || "");
      setPenggunaNip(sig.pengguna?.nip || "");
      setPptkNama(sig.pptk?.nama || "");
      setPptkNip(sig.pptk?.nip || "");
      setBendaharaNama(sig.bendahara?.nama || "");
      setBendaharaNip(sig.bendahara?.nip || "");
      setPenerimaNama(sig.penerima?.nama || "");
    }
  }, [location]);

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
    pph21: pphEnabled ? pphNumber : 0,
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
          // PDF/PRINT-only: trim bottom padding to remove extra space after copy 2
          el.classList.add('pdf-trim-bottom');
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
      el.classList.remove('pdf-trim-bottom');
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
      el.classList.remove('pdf-trim-bottom');
        });
      }
    }
  };

  // Save to Firestore (laporan_honor)
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const handleSave = async () => {
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
        pph21: pphEnabled ? pphNumber : 0,
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
        await updateDoc(doc(db, 'laporan_honor', editId), docData);
        setSaveMsg('Berhasil diperbarui.');
      } else {
        await addDoc(collection(db, 'laporan_honor'), docData);
        setSaveMsg('Berhasil disimpan ke Laporan Honor.');
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
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
          <div className="card-header text-center fw-semibold">KWITANSI HONOR</div>
          <div className="card-body pt-3">
            { /* Reverted to simple single-field-per-row layout (user requested) */ }
            {[
              { label: 'Lembar', key: 'lembar', bind: { value: lembar, onChange: (e)=> setLembar(e.target.value) } },
              { label: 'Bukti Kas Nomor', key: 'buktiKas', bind: { value: buktiKas, onChange: (e)=> setBuktiKas(e.target.value) } },
              { label: 'Kode Rekening*', key: 'kodeRek', bind: { value: kodeRek, onChange: (e)=> setKodeRek(e.target.value) } },
              { heading: true, label: 'KWITANSI' },
              { label: 'Terima Dari*', key: 'terimaDari', bind: { value: terimaDari, onChange: (e)=> setTerimaDari(e.target.value) } },
              { label: 'Uang Sebanyak*', key: 'uangSebanyak', bind: { value: uangSebanyakAuto } },
              { label: 'Untuk pembayaran*', key: 'untukPembayaran', bind: { value: untukPembayaran, onChange: (e)=> setUntukPembayaran(e.target.value) } },
              { label: 'Uraian', noInput: true, key: 'uraian' },
              { label: 'Nota Pembayaran*', key: 'notaPembayaran', type: 'numberCurrency' },
              { label: 'PPH 21', key: 'pph21', type: 'numberCurrency' },
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
                    {!f.noInput && f.type === 'numberCurrency' && f.key === 'pph21' && (
                      <input
                        className={`form-control form-control-sm ${!pphEnabled ? 'kw-readonly' : ''}`}
                        value={pphEnabled ? (pph21 === 0 ? '' : formatNumber(pphNumber)) : ''}
                        onChange={(e) => setPph21(parseNumeric(e.target.value))}
                        inputMode="numeric"
                        disabled={!pphEnabled}
                      />
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

