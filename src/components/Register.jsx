import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth";
import "./Register.css";
import instansiAsset from "../assets/instansi - logo.png";

// Logo component: try env-provided URL first, then common filenames in /public, then /vite.svg, finally a colored circle
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
    <div className="register-wrapper">
      <div className="register-card">
        <aside className="brand-side" aria-label="Brand">
          <LogoCircle />
          <div className="brand-text">
            <span>DINAS</span>
            <span>PEMBERDAYAAN</span>
            <span>MASYARAKAT</span>
            <span>DAN DESA</span>
            <span>KABUPATEN</span>
            <span>NGANJUK</span>
          </div>
        </aside>

        <section className="form-side">
          <form onSubmit={handleRegister} className="register-form" noValidate>
            <div className="field">
              <input
                className="input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="field">
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <input
                className="input"
                type={showPwd ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                className="toggle-eye"
                aria-label={showPwd ? "Sembunyikan password" : "Tampilkan password"}
                aria-pressed={showPwd}
                onClick={() => setShowPwd((s) => !s)}
              >
                <EyeIcon closed={!showPwd} />
              </button>
            </div>
            <div className="field">
              <input
                className={`input ${confirmMismatch ? 'is-invalid' : ''}`}
                type={showConfirmPwd ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                className="toggle-eye"
                aria-label={showConfirmPwd ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                aria-pressed={showConfirmPwd}
                onClick={() => setShowConfirmPwd((s) => !s)}
              >
                <EyeIcon closed={!showConfirmPwd} />
              </button>
              {confirmMismatch && (
                <p className="error-text">Konfirmasi password tidak cocok</p>
              )}
            </div>

            <button type="submit" className="signup-btn" disabled={!!confirmMismatch}>Sign Up</button>
            <p className="login-hint">
              Already have an account? {" "}
              <Link className="login-link" to="/login">Log in</Link>
            </p>
          </form>
        </section>
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
