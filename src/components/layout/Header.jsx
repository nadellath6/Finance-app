import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import instansiAsset from "../../assets/instansi - logo.png";

export default function Header(){
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    navigate("/login");
    try{ await signOut(auth); } catch (e) { console.warn('Logout gagal', e); }
  };

  const isActive = (pathPrefix) => location.pathname === pathPrefix || location.pathname.startsWith(pathPrefix + '/');
  const handleCreateNav = (e, path) => {
    // Tanpa konfirmasi apapun: bersihkan flag dirty dan biarkan Link melakukan navigasi
    try { window.localStorage.setItem('kwitansi_dirty','0'); } catch {}
  };

  return (
  <nav className="navbar navbar-expand-lg sticky-top shadow-sm" style={{background:'#8f8f96', zIndex: 1200}}>
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-3">
          <LogoCircle />
          <div className="text-white lh-sm fw-semibold" style={{fontSize:'14px'}}>
            <div style={{fontSize:'20px'}}>DINAS PEMBERDAYAAN MASYARAKAT DAN DESA</div>
            <div style={{fontSize:'20px'}}>KABUPATEN NGANJUK</div>
          </div>
        </div>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#dashNav" aria-controls="dashNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" style={{filter:'invert(1)'}}></span>
        </button>
        <div className="collapse navbar-collapse" id="dashNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2 pe-lg-2">
            <li className="nav-item me-lg-2">
              <Link to="/dashboard" className={`nav-link nav-main ${isActive('/dashboard') ? 'active fw-semibold text-white' : 'text-light'}`}>Halaman Utama</Link>
            </li>
            <li className="nav-item dropdown me-lg-2">
              <button className={`nav-link nav-main dropdown-toggle btn btn-link p-0 ${isActive('/kwitansi') ? 'active text-white' : 'text-light'}`} id="createDropdown" data-bs-toggle="dropdown" aria-expanded="false" style={{textDecoration:'none'}}>
                Buat Kwitansi
              </button>
              <ul className="dropdown-menu" aria-labelledby="createDropdown">
                <li><span className="dropdown-header text-uppercase small fw-semibold">Jenis</span></li>
                <li><Link className="dropdown-item small" to="/kwitansi/honor" onClick={(e)=>handleCreateNav(e,'/kwitansi/honor')}>Kwitansi Honor</Link></li>
                <li><Link className="dropdown-item small" to="/kwitansi/jasa" onClick={(e)=>handleCreateNav(e,'/kwitansi/jasa')}>Kwitansi Jasa</Link></li>
                <li><Link className="dropdown-item small" to="/kwitansi/barang" onClick={(e)=>handleCreateNav(e,'/kwitansi/barang')}>Kwitansi Barang</Link></li>
              </ul>
            </li>
            <li className="nav-item dropdown me-lg-2">
              <button className={`nav-link nav-main dropdown-toggle btn btn-link p-0 ${isActive('/laporan') ? 'active text-white' : 'text-light'}`} id="reportDropdown" data-bs-toggle="dropdown" aria-expanded="false" style={{textDecoration:'none'}}>
                Laporan
              </button>
              <ul className="dropdown-menu" aria-labelledby="reportDropdown">
                <li><span className="dropdown-header text-uppercase small fw-semibold">Kategori</span></li>
                <li><Link className="dropdown-item small" to="/laporan/honor">Laporan Honor</Link></li>
                <li><Link className="dropdown-item small" to="/laporan/jasa">Laporan Jasa</Link></li>
                <li><Link className="dropdown-item small" to="/laporan/barang">Laporan Barang</Link></li>
              </ul>
            </li>
          </ul>
          <div className="d-flex pt-3 pt-lg-0">
            <button className="btn btn-sm btn-outline-light fw-semibold" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
      {/* LayoutSettings removed per revert request */}
    </nav>
  );
}

function LogoCircle(){
  const candidates = [
    instansiAsset,
    import.meta.env?.VITE_LOGO_URL,
    "/instansi-logo.png",
  ].filter(Boolean);
  const [idx, setIdx] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  if (!failed && candidates[idx]) {
    return (
      <img
  className="dash-logo"
        src={candidates[idx]}
        alt="Logo Instansi"
        onError={() => {
          if (idx < candidates.length - 1) setIdx((i) => i + 1);
          else setFailed(true);
        }}
      />
    );
  }
  return <div className="dash-logo dash-logo-fallback" aria-hidden="true"/>;
}