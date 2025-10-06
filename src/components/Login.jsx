import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
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
    <div className="register-wrapper login-compact">
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
          <form onSubmit={handleLogin} className="register-form" autoComplete="on" noValidate>
            <div className="field">
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                name="email"
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
                autoComplete="current-password"
                name="current-password"
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

            <div className="remember-row">
              <input id="rememberMe" type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} />
              <label htmlFor="rememberMe">Ingat saya</label>
            </div>
            <button type="submit" className="signup-btn">Login</button>
            <p className="login-hint">
              Belum punya akun? {" "}
              <Link className="login-link" to="/register">Register</Link>
            </p>
          </form>
        </section>
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
