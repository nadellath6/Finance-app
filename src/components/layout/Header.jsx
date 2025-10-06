import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import instansiAsset from "../../assets/instansi - logo.png";

export default function Header(){
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const handleLogout = async () => {
    navigate("/login");
    try{ await signOut(auth); } catch (e) { console.warn('Logout gagal', e); }
  };

  return (
    <>
      <header className="dash-header">
        <div className="dash-brand">
          <LogoCircle />
          <div className="dash-title">
            <div>DINAS PEMBERDAYAAN MASYARAKAT DAN DESA</div>
            <div>KABUPATEN NGANJUK</div>
          </div>
        </div>
        <button className="dash-logout" onClick={handleLogout}>Logout</button>
      </header>
      <nav className="dash-nav">
        <Link to="/dashboard" className={`dash-nav-item ${location.pathname === '/dashboard' ? 'dash-active' : ''}`}>Halaman Utama<span className="caret"/></Link>
        <div className="dash-nav-item has-dropdown" onMouseEnter={()=>setCreateOpen(true)} onMouseLeave={()=>setCreateOpen(false)}>
          <button className={`nav-btn ${location.pathname.startsWith('/kwitansi/') ? 'dash-active' : ''}`} onClick={()=>setCreateOpen(v=>!v)}>Buat Kwitansi <span className="caret"/></button>
          <div className={`dropdown ${createOpen ? 'open' : ''}`}>
            <Link to="/kwitansi/honor" className="dropdown-item">Kwitansi Honor</Link>
            <Link to="/kwitansi/jasa" className="dropdown-item">Kwitansi Jasa</Link>
            <Link to="/kwitansi/barang" className="dropdown-item">Kwitansi Barang</Link>
          </div>
        </div>
        <div className="dash-nav-item has-dropdown" onMouseEnter={()=>setReportOpen(true)} onMouseLeave={()=>setReportOpen(false)}>
          <button className={`nav-btn ${location.pathname.startsWith('/laporan/') ? 'dash-active' : ''}`} onClick={()=>setReportOpen(v=>!v)}>Laporan <span className="caret"/></button>
          <div className={`dropdown ${reportOpen ? 'open' : ''}`}>
            <Link to="/laporan/honor" className="dropdown-item">Laporan Honor</Link>
            <Link to="/laporan/jasa" className="dropdown-item">Laporan Jasa</Link>
            <Link to="/laporan/barang" className="dropdown-item">Laporan Barang</Link>
          </div>
        </div>
      </nav>
    </>
  );
}

function LogoCircle(){
  const candidates = [
    instansiAsset,
    import.meta.env?.VITE_LOGO_URL,
    "/instansi-logo.png",
    "/logo.png",
    "/logo.jpg",
    "/logo.jpeg",
    "/logo.svg",
    "/logo.webp",
    "/vite.svg",
  ].filter(Boolean);
  const [idx, setIdx] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  if (!failed && candidates[idx]) {
    return (
      <img
        className="brand-logo"
        src={candidates[idx]}
        alt="Logo Instansi"
        onError={() => {
          if (idx < candidates.length - 1) setIdx((i) => i + 1);
          else setFailed(true);
        }}
      />
    );
  }
  return <div className="brand-logo brand-logo-fallback" aria-hidden="true"/>;
}