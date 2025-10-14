import React from "react";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import "./Register.css"; // reuse variables and logo styles
import "./Dashboard.css";
import Header from "./layout/Header";

function Dashboard() {
  // navigation handled in Header
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || "Pengguna";
  const [totalKwitansi, setTotalKwitansi] = React.useState(null);
  const [latest, setLatest] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(5);

  // logout handled in Header

  // Helpers
  const toFriendlyType = (t) => {
    if (!t) return "-";
    if (t === "kwitansi-honor") return "Kwitansi Honor";
    return String(t).replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const toLocaleDate = (row) => {
    try {
      if (row.createdAt?.toDate) return row.createdAt.toDate().toLocaleDateString("id-ID");
      if (row.tanggal) return new Date(row.tanggal).toLocaleDateString("id-ID");
    } catch {}
    return "-";
  };

  const formatIDR = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

  // Load Firestore stats (synced with laporan_honor)
  React.useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const coll = collection(db, "laporan_honor");
        const baseQ = query(coll);
        // latest (live updates) - client-side sort to avoid index requirements
        unsub = onSnapshot(baseQ, (qs) => {
          const items = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
          items.sort((a, b) => {
            const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.tanggal ? new Date(a.tanggal).getTime() : 0);
            const dbt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.tanggal ? new Date(b.tanggal).getTime() : 0);
            return dbt - da;
          });
          setTotalKwitansi(items.length);
          setLatest(items);
        });
      } catch (e) {
        console.error("Gagal memuat data dashboard", e);
      }
    })();
    return () => unsub();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Header />

      <main className="container py-3">
        <h3 className="fw-semibold mb-4">Halo, selamat datang {displayName}</h3>
        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-4">
            <div className="card text-bg-secondary h-100 shadow-sm">
              <div className="card-body d-flex flex-column justify-content-center text-center">
                <div className="small text-uppercase opacity-75 fw-semibold">Total Kwitansi</div>
                <div className="display-6 fw-bold mt-2" style={{fontSize:'2.2rem'}}>{totalKwitansi ?? '-'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card shadow-sm">
          <div className="card-header py-2 fw-semibold d-flex align-items-center justify-content-between">
            <span>Daftar Kwitansi Terbaru</span>
            <div className="d-flex align-items-center gap-2">
              <label className="small mb-0 me-1" htmlFor="dash-page-size">Tampilkan</label>
              <select
                id="dash-page-size"
                className="form-select form-select-sm"
                style={{ width: 90 }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[5,10,20,50,100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="card-body p-0">
            {latest.length === 0 ? (
              <div className="p-3 text-muted small">Belum ada data</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover table-striped mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Tanggal</th>
                      <th>Jenis</th>
                      <th>Kepada</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.slice(0, pageSize).map(row => {
                      const kepada = row?.signatures?.penerima?.nama || row?.terimaDari || '-';
                      return (
                        <tr key={row.id}>
                          <td>{toLocaleDate(row)}</td>
                          <td>{toFriendlyType(row.type)}</td>
                          <td>{kepada}</td>
                          <td className="text-end">{formatIDR(row.jumlahDiterimakan)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
