import React from 'react';
import './PreviewModal.css';
import usePrint from '../hooks/usePrint';
import ReceiptDocument from './Receipt';

// Format number with Indonesian thousands separators and 2 decimal places (",00")
const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '' || isNaN(val)) return '';
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val));
};

function ReceiptBlock({ index, data }) {
  const { lembar, buktiKas, kodeRek, terimaDari, uangSebanyak, untukPembayaran, notaPembayaran, useMode, dpp,
    pph21 = 0, pph22 = 0, pph23 = 0, ppn = 0, pad = 0,
    jumlahDiterimakan, tanggal, lokasi = 'Nganjuk,', penerimaNama,
    penggunaNama, penggunaNip, pptkNama, pptkNip, bendaharaNama, bendaharaNip } = data;

  return (
    <div className="receipt-block" data-copy={index + 1}>
      {/* Right top block: 2-column meta table, left col empty, right col right-aligned lines */}
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
      {/* Center title */}
      <div className="title-center">KWITANSI</div>
      {/* Info and amounts */}
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
                        <td className="albl">{useMode === 'dpp' && dpp ? 'DPP' : 'Nota Pembayaran'}</td>
                        <td className="acolon">:</td>
                        <td className="acurrency">{(useMode === 'dpp' ? dpp : notaPembayaran) ? 'Rp' : ''}</td>
                        <td className="aval value condensed-val">{(useMode === 'dpp' ? dpp : notaPembayaran) ? formatCurrency(useMode === 'dpp' ? dpp : notaPembayaran) : ''}</td>
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
        {/* amount table moved inline with Uraian row */}
      </div>
      {/* Signatures */}
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
          <div className="sig-label sig-lokasi-left">
            <span className="line-left">Nganjuk,</span>
            <span className="line-center">Penerima</span>
          </div>
          <div className="sig-space" />
          <div className="sig-name-line">{penerimaNama || 'Nama'}</div>
          <div className="sig-nip">{/* no NIP for Penerima per earlier requirement, keep placeholder optional */}</div>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ data, onClose }) {
  return (
    <div className="preview-overlay">
      <div className="preview-dialog shadow">
        <div className="preview-toolbar d-flex justify-content-between align-items-center mb-2">
          <span className="fw-semibold small">Preview Kwitansi</span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>Tutup</button>
          </div>
        </div>
        {/* A4 paper wrapper: ukuran persis 210x297mm */}
        <div className="a4-sheet">
          <ReceiptDocument data={data} />
        </div>
        <div className="print-hint small text-muted mt-2">Cetak untuk hasil akhir.</div>
      </div>
    </div>
  );
}

export default PreviewModal;
