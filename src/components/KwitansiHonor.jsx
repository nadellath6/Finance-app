import React from "react";
import Header from "./layout/Header";
import "./KwitansiHonor.css";

function KwitansiHonor() {
  return (
    <div className="dashboard-wrapper">
      <Header />
      <div className="kw-page">
        <div className="kw-title">KWITANSI HONOR</div>

        {/* Top right small fields */}
        <div className="kw-top-right">
          <div className="kw-label">Lembar</div>
          <input className="kw-input" />
          <div className="kw-label">Bukti Kas Nomor</div>
          <input className="kw-input" />
          <div className="kw-label">Kode Rekening*</div>
          <input className="kw-input" />
        </div>

        <div className="kw-center-label">Kwitansi</div>

        {/* Left 3 fields */}
        <div className="kw-left3">
          <div className="kw-label">Terima Dari*</div>
          <input className="kw-input" />
          <div className="kw-label">Uang Sebanyak*</div>
          <input className="kw-input" />
          <div className="kw-label">Untuk pembayaran*</div>
          <input className="kw-input" />
        </div>

        

        {/* Kwitansi details */}
        <div className="kw-detail">
          <div className="kw-label">Uraian</div>
          
          <div className="kw-label">Nota Pembayaran*</div>
          <input className="kw-input" />
          <div className="kw-label">PPH 21</div>
          <input className="kw-input" />
          <div className="kw-label">Jumlah diterimakan</div>
          <input className="kw-input" />
        </div>

        {/* Signature row */}
        <div className="kw-signatures">
          <div className="kw-sign-label">Setuju dibayar Pengguna Anggaran</div>
          <div className="kw-sign-label">Pengguna Anggaran</div>
          <div className="kw-sign-label">Mengetahui</div>
          <div className="kw-sign-label">PPTK</div>
          <div className="kw-sign-label">Lunas dibayar Bendahara</div>
          <div className="kw-sign-label">Bendahara</div>
          <div className="kw-right-note">Nganjuk,</div>

          <input className="kw-input" placeholder="Masukkan Nama" />
          <input className="kw-input" placeholder="Masukkan Nama" />
          <input className="kw-input" placeholder="Masukkan Nama" />
          <input className="kw-input" placeholder="Masukkan Nama" />

          <input className="kw-input" placeholder="Masukkan NIP" />
          <input className="kw-input" placeholder="Masukkan NIP" />
          <input className="kw-input" placeholder="Masukkan NIP" />
          <span />
        </div>
      </div>
    </div>
  );
}

export default KwitansiHonor;

