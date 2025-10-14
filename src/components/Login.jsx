import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css"; // Keep for now (logo + brand text) – will prune later
import instansiAsset from "../assets/instansi - logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Prefill email and rememberMe from localStorage (no auto-redirect)
  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe") === "true";
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedRemember) setRememberMe(true);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      // Store email if rememberMe, else clear
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberEmail");
      }
      navigate("/dashboard");
    } catch (error) {
      alert("Login gagal: " + error.message);
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
          <form onSubmit={handleLogin} className="w-100" autoComplete="on" noValidate>
            <div className="mb-3 position-relative">
              <input
                className="form-control form-control-sm"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                name="email"
              />
            </div>
            <div className="mb-2 position-relative">
              <input
                className="form-control form-control-sm pe-5"
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                name="current-password"
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
            <div className="d-flex align-items-center gap-2 mb-3 small text-secondary">
              <input id="rememberMe" type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} />
              <label htmlFor="rememberMe" className="m-0">Ingat saya</label>
            </div>
            <div className="d-flex flex-column align-items-center">
              <button type="submit" className="btn btn-secondary rounded-pill px-4 fw-semibold">Login</button>
              <p className="text-secondary small mt-3 mb-0">Don't have an account? <Link to="/register" className="text-decoration-none fw-semibold">Register</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

// Reuse the eye icon SVG used in Register
function EyeIcon({ closed = false }) {
  return (
    <svg className="eye-icon" viewBox="0 0 24 24" focusable="false" aria-hidden>
      <g style={{ display: closed ? 'none' : 'block' }}>
        <path className="eye-outline" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle className="iris" cx="12" cy="12" r="3" fill="currentColor" />
      </g>
      <g style={{ display: closed ? 'block' : 'none' }}>
        <path d="M1 12s4-7 11-7 11 7 11 7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  );
}

// Same logo loader as Register
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
