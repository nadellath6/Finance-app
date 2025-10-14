import instansiAsset from "../assets/instansi - logo.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth";
import "./Register.css"; // Keep for custom branding pieces during migration

// Logo component: try env-provided URL first, then common filenames in /public, then /vite.svg, finally a colored circle
function LogoCircle(){
  const candidates = [
    instansiAsset,
    import.meta.env?.VITE_LOGO_URL,
    "/instansi-logo.png",
  ].filter(Boolean);

  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

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

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const confirmMismatch = password && confirmPassword && password !== confirmPassword;
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      await register(email, password, username);
      alert("Registrasi berhasil! Silakan login.");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      navigate("/login");
    } catch (error) {
      alert("Registrasi gagal: " + error.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
  <div className="row g-0 shadow-lg rounded overflow-hidden w-100" style={{maxWidth: '760px'}}>
        <div className="col-md-5 d-flex flex-column bg-secondary text-white p-4 justify-content-center">
          <div className="d-flex align-items-center gap-3 mb-3">
            <LogoCircle />
            <div className="brand-text d-flex flex-column lh-1 fw-semibold">
              <span>DINAS</span>
              <span>PEMBERDAYAAN</span>
              <span>MASYARAKAT</span>
              <span>DAN DESA</span>
              <span>KABUPATEN</span>
              <span>NGANJUK</span>
            </div>
          </div>
        </div>
        <div className="col-md-7 bg-body-secondary p-4 d-flex align-items-center">
          <form onSubmit={handleRegister} className="w-100" noValidate>
            <div className="mb-3 position-relative">
              <input
                className="form-control form-control-sm"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="mb-3 position-relative">
              <input
                className="form-control form-control-sm"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="mb-3 position-relative">
              <input
                className="form-control form-control-sm pe-5"
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                className="btn btn-sm btn-link text-secondary position-absolute top-50 end-0 translate-middle-y pe-3"
                aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPwd}
                onClick={() => setShowPwd(s => !s)}
                style={{textDecoration:'none'}}
              >
                <EyeIcon closed={!showPwd} />
              </button>
            </div>
            <div className="mb-2 position-relative">
              <input
                className={`form-control form-control-sm pe-5 ${confirmMismatch ? 'is-invalid' : ''}`}
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                className="btn btn-sm btn-link text-secondary position-absolute top-50 end-0 translate-middle-y pe-3"
                aria-label={showConfirmPwd ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                aria-pressed={showConfirmPwd}
                onClick={() => setShowConfirmPwd(s => !s)}
                style={{textDecoration:'none'}}
              >
                <EyeIcon closed={!showConfirmPwd} />
              </button>
              {confirmMismatch && (
                <p className="text-danger small mt-1 mb-0">Konfirmasi password tidak cocok</p>
              )}
            </div>
            <div className="d-flex flex-column align-items-center mt-3">
              <button type="submit" className="btn btn-secondary rounded-pill px-4 fw-semibold" disabled={!!confirmMismatch}>Sign Up</button>
              <p className="text-secondary small mt-3 mb-0">Already have an account? <Link to="/login" className="text-decoration-none fw-semibold">Log in</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;

// Simple blinking eye SVG icon (no emoji)
function EyeIcon({ closed = false }) {
  return (
    <svg className="eye-icon" viewBox="0 0 24 24" focusable="false" aria-hidden>
      {/* Open eye */}
      <g style={{ display: closed ? 'none' : 'block' }}>
        <path className="eye-outline" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle className="iris" cx="12" cy="12" r="3" fill="currentColor" />
      </g>
      {/* Closed eye (with slash) */}
      <g style={{ display: closed ? 'block' : 'none' }}>
        <path d="M1 12s4-7 11-7 11 7 11 7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  );
}
