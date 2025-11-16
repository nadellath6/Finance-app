import React, { useState, useEffect } from 'react';
import './PreviewModal.css';
import { useToast } from './ui/ToastProvider.jsx';
import { useNavigate } from 'react-router-dom';

// Format number with Indonesian thousands separators and 2 decimal places (",00")
const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '' || isNaN(val)) return '';
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val));
};

function ReceiptBlock({ index, data }) {
  const { lembar, buktiKas, kodeRek, terimaDari, uangSebanyak, untukPembayaran, notaPembayaran,
    pph21 = 0, pph22 = 0, pph23 = 0, ppn = 0, pad = 0,
    jumlahDiterimakan, tanggal, lokasi = 'Nganjuk,', penerimaNama,
    penggunaNama, penggunaNip, pptkNama, pptkNip, bendaharaNama, bendaharaNip } = data;

  const toast = useToast();
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nextHref, setNextHref] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    // Update state and mark as unsaved
    setUnsavedChanges(true);
    // ...existing code for handling input changes...
  };

  const handleSave = () => {
    // Save logic
    setUnsavedChanges(false);
    // ...existing code for saving...
  };

  // Tampilkan toast peringatan hanya saat mengedit kwitansi yang sudah ada (memiliki id)
  useEffect(() => {
    if (unsavedChanges && data.id) {
      const id = toast.info('Anda belum menyimpan perubahan. Simpan sekarang?', {
        title: 'Perubahan Belum Disimpan',
        duration: 0,
      });
      return () => toast.remove(id);
    }
  }, [unsavedChanges, toast, data.id]);

  // Cegah keluar/refresh tab browser saat ada perubahan belum disimpan
  useEffect(() => {
    if (!unsavedChanges) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsavedChanges]);

  // Intersep klik Link internal saat ada perubahan belum disimpan (tanpa useBlocker)
  useEffect(() => {
    if (!(unsavedChanges && index === 0)) return;
    const onClick = (e) => {
      // cari elemen anchor terdekat
      let el = e.target;
      while (el && el !== document && el.tagName !== 'A') el = el.parentElement;
      if (!el || el.tagName !== 'A') return;
      const href = el.getAttribute('href');
      const target = el.getAttribute('target');
      // abaikan jika modifier keys atau target _blank
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!href || href.startsWith('http') || target === '_blank') return;
      // abaikan anchor hash
      if (href.startsWith('#')) return;
      // cegah navigasi dan tampilkan modal
      e.preventDefault();
      setNextHref(href);
      setShowConfirm(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [unsavedChanges, index]);

  const handleConfirmSave = async () => {
    try {
      await Promise.resolve(handleSave());
    } finally {
      const dest = nextHref;
      setShowConfirm(false);
      setNextHref(null);
      if (dest) navigate(dest);
    }
  };

  const handleCancelLeave = () => {
    setShowConfirm(false);
    setNextHref(null);
  };

  return (
    <>
      <div className="receipt-block" data-copy={index + 1}>
      <div className="top-right-block">
        <table className="top-meta meta-like-amount meta-colon-layout">
          <tbody>
            <tr>
              <td className="meta-label">Lembar</td>
              <td className="meta-colon">:</td>
              <td className="meta-value"><span className="meta-dotted">{lembar || ''}</span></td>
            </tr>
            <tr>
              <td className="meta-label">Bukti Kas Nomor</td>
              <td className="meta-colon">:</td>
              <td className="meta-value"><span className="meta-dotted">{buktiKas || ''}</span></td>
            </tr>
            <tr>
              <td className="meta-label">Kode Rekening</td>
              <td className="meta-colon">:</td>
              <td className="meta-value"><span className="meta-dotted">{kodeRek || ''}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="title-center">KWITANSI</div>
      <div className="info-row">
        <div className="info-left">
          <table>
            <tbody>
              <tr><td className="lbl">Terima Dari</td><td className="colon">:</td><td className="val dotted wide">{terimaDari || ''}</td></tr>
              <tr><td className="lbl">Uang Sebanyak</td><td className="colon">:</td><td className="val dotted wide">{uangSebanyak || ''}</td></tr>
              <tr><td className="lbl">Untuk Pembayaran</td><td className="colon">:</td><td className="val dotted wide">{untukPembayaran || ''}</td></tr>
              <tr className="uraian-row">
                <td className="lbl">Uraian</td>
                <td className="uraian-amount-cell" colSpan={2}>
                  <table className="amount-table inline">
                    <tbody>
                      <tr className="amt-row">
                        <td className="albl">Nota Pembayaran</td>
                        <td className="acolon">:</td>
                        <td className="acurrency">{notaPembayaran ? 'Rp' : ''}</td>
                        <td className="aval value condensed-val">{notaPembayaran ? formatCurrency(notaPembayaran) : ''}</td>
                      </tr>
                      {pph21 ? (
                        <tr className="amt-row">
                          <td className="albl">PPh 21</td>
                          <td className="acolon">:</td>
                          <td className="acurrency">Rp</td>
                          <td className="aval value condensed-val">{formatCurrency(pph21)}</td>
                        </tr>
                      ) : null}
                      {pph22 ? (
                        <tr className="amt-row">
                          <td className="albl">PPh 22</td>
                          <td className="acolon">:</td>
                          <td className="acurrency">Rp</td>
                          <td className="aval value condensed-val">{formatCurrency(pph22)}</td>
                        </tr>
                      ) : null}
                      {pph23 ? (
                        <tr className="amt-row">
                          <td className="albl">PPh 23</td>
                          <td className="acolon">:</td>
                          <td className="acurrency">Rp</td>
                          <td className="aval value condensed-val">{formatCurrency(pph23)}</td>
                        </tr>
                      ) : null}
                      {ppn ? (
                        <tr className="amt-row">
                          <td className="albl">PPN</td>
                          <td className="acolon">:</td>
                          <td className="acurrency">Rp</td>
                          <td className="aval value condensed-val">{formatCurrency(ppn)}</td>
                        </tr>
                      ) : null}
                      {pad ? (
                        <tr className="amt-row">
                          <td className="albl">PAD</td>
                          <td className="acolon">:</td>
                          <td className="acurrency">Rp</td>
                          <td className="aval value condensed-val">{formatCurrency(pad)}</td>
                        </tr>
                      ) : null}
                      <tr className="amt-row total">
                        <td className="albl">Jumlah Diterimakan</td>
                        <td className="acolon">:</td>
                        <td className="acurrency">{jumlahDiterimakan ? 'Rp' : ''}</td>
                        <td className="aval value condensed-val">{jumlahDiterimakan ? formatCurrency(jumlahDiterimakan) : ''}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="signature-row">
        <div className="sig-col">
          <div className="sig-label sig-shift-right">Setuju dibayar<br/>Pengguna Anggaran</div>
          <div className="sig-space" />
          <div className="sig-name-line">{penggunaNama || 'Nama'}</div>
          <div className="sig-nip">{penggunaNip || 'NIP'}</div>
        </div>
        <div className="sig-col">
          <div className="sig-label sig-shift-mengetahui">Mengetahui<br/>PPTK</div>
          <div className="sig-space" />
          <div className="sig-name-line">{pptkNama || 'Nama'}</div>
          <div className="sig-nip">{pptkNip || 'NIP'}</div>
        </div>
        <div className="sig-col">
          <div className="sig-label">
            <span className="line-left">Lunas dibayar</span>
            <span className="line-center">Bendahara</span>
          </div>
          <div className="sig-space" />
          <div className="sig-name-line">{bendaharaNama || 'Nama'}</div>
          <div className="sig-nip">{bendaharaNip || 'NIP'}</div>
        </div>
        <div className="sig-col">
          <div className="sig-label sig-lokasi-left">Nganjuk,</div>
          <div className="sig-space" />
          <div className="sig-name-line">{penerimaNama || 'Nama'}</div>
          <div className="sig-nip">{/* no NIP for Penerima */}</div>
        </div>
      </div>

      {/* penutup wrapper receipt-block */}
      </div>

      {index === 0 && showConfirm ? (
        <>
          <div className="modal-backdrop show"></div>
          <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Perubahan Belum Disimpan</h5>
                  <button type="button" className="btn-close" aria-label="Tutup" onClick={handleCancelLeave}></button>
                </div>
                <div className="modal-body">
                  <p>Apakah Anda tidak menyimpan kwitansi? Tinggalkan halaman tanpa menyimpan?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCancelLeave}>Tidak</button>
                  <button type="button" className="btn btn-primary" onClick={handleConfirmSave}>Simpan</button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

export default function ReceiptDocument({ data }) {
  const copies = [data, data];
  return (
    <div className="doc-frame dual spec-layout">
      {copies.map((d, i) => (
        <ReceiptBlock key={i} index={i} data={d} />
      ))}
    </div>
  );
}
