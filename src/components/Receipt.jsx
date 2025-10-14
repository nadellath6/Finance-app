import React from 'react';
import './PreviewModal.css';

// Format number with Indonesian thousands separators and 2 decimal places (",00")
const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '' || isNaN(val)) return '';
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val));
};

function ReceiptBlock({ index, data }) {
  const { lembar, buktiKas, kodeRek, terimaDari, uangSebanyak, untukPembayaran, notaPembayaran, pph21, jumlahDiterimakan, tanggal, lokasi = 'Nganjuk,', penerimaNama,
    penggunaNama, penggunaNip, pptkNama, pptkNip, bendaharaNama, bendaharaNip } = data;

  return (
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
                      <tr className="amt-row">
                        <td className="albl">PPh 21</td>
                        <td className="acolon">:</td>
                        <td className="acurrency">{pph21 ? 'Rp' : ''}</td>
                        <td className="aval value condensed-val">{pph21 ? formatCurrency(pph21) : ''}</td>
                      </tr>
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
    </div>
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
