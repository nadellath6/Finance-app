
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/dashboard";
import TransaksiForm from "./components/TransaksiForm";
import KwitansiHonor from "./components/KwitansiHonor";
import KwitansiJasa from "./components/KwitansiJasa";
import KwitansiBarang from "./components/KwitansiBarang";
import LaporanHonor from "./components/reports/LaporanHonor";
import LaporanJasa from "./components/reports/LaporanJasa";
import LaporanBarang from "./components/reports/LaporanBarang";
import UserManagement from "./components/UserManagement";


function App() {
  const [user, setUser] = useState(undefined); // undefined: loading, null: not logged in

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  if (user === undefined) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-secondary">
        Memuat...
      </div>
    );
  }

  const RequireAuth = ({ children }) => {
    return user ? children : <Navigate to="/login" replace />;
  };

  const RedirectIfLoggedIn = ({ children }) => {
    return user ? <Navigate to="/dashboard" replace /> : children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
        <Route path="/login" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
        <Route path="/register" element={<RedirectIfLoggedIn><Register /></RedirectIfLoggedIn>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/transaksi" element={<RequireAuth><TransaksiForm /></RequireAuth>} />
        <Route path="/kwitansi/honor" element={<RequireAuth><KwitansiHonor /></RequireAuth>} />
        <Route path="/kwitansi/jasa" element={<RequireAuth><KwitansiJasa /></RequireAuth>} />
        <Route path="/kwitansi/barang" element={<RequireAuth><KwitansiBarang /></RequireAuth>} />
        <Route path="/laporan/honor" element={<RequireAuth><LaporanHonor /></RequireAuth>} />
        <Route path="/laporan/jasa" element={<RequireAuth><LaporanJasa /></RequireAuth>} />
        <Route path="/laporan/barang" element={<RequireAuth><LaporanBarang /></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth><UserManagement /></RequireAuth>} />
      </Routes>
    </Router>
  );
}

export default App;

