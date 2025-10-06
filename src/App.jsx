
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transaksi" element={<TransaksiForm />} />
        <Route path="/kwitansi/honor" element={<KwitansiHonor />} />
        <Route path="/kwitansi/jasa" element={<KwitansiJasa />} />
        <Route path="/kwitansi/barang" element={<KwitansiBarang />} />
  <Route path="/laporan/honor" element={<LaporanHonor />} />
  <Route path="/laporan/jasa" element={<LaporanJasa />} />
  <Route path="/laporan/barang" element={<LaporanBarang />} />
      </Routes>
    </Router>
  );
}

export default App;

