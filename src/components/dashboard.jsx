import React from "react";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import "./Register.css"; // reuse variables and logo styles
import "./Dashboard.css";
import Header from "./layout/Header";

function Dashboard() {
  // navigation handled in Header
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || "Pengguna";
  const [totalKwitansi, setTotalKwitansi] = React.useState(null);
  const [totalNilai, setTotalNilai] = React.useState(0);
  const [latest, setLatest] = React.useState([]);
  const [pageSize, setPageSize] = React.useState(5);
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  // draft inputs: only applied when user clicks "Cari"
  const [searchDraft, setSearchDraft] = React.useState("");
  const [dateFromDraft, setDateFromDraft] = React.useState("");
  const [dateToDraft, setDateToDraft] = React.useState("");

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
  const toMs = (t) => {
    if (!t) return 0;
    if (typeof t?.toDate === 'function') return t.toDate().getTime();
    if (typeof t?.toMillis === 'function') return t.toMillis();
    try { return new Date(t).getTime(); } catch { return 0; }
  };
  const toAmount = (row) => {
    // Honor uses jumlahDiterimakan; jasa/barang use total
    if (row && typeof row.jumlahDiterimakan !== 'undefined') {
      const v = Number(row.jumlahDiterimakan);
      if (!isNaN(v)) return v;
    }
    if (row && typeof row.total !== 'undefined') {
      const v = Number(row.total);
      if (!isNaN(v)) return v;
    }
    // fallback: nota + pph21 when jumlahDiterimakan absent
    const nota = Number(row?.notaPembayaran || 0);
    const pph = Number(row?.pph21 || 0);
    return (isNaN(nota) ? 0 : nota) + (isNaN(pph) ? 0 : pph);
  };
  const routeForType = (t) => {
    switch (t) {
      case 'kwitansi-honor': return '/kwitansi/honor';
      case 'kwitansi-jasa': return '/kwitansi/jasa';
      case 'kwitansi-barang': return '/kwitansi/barang';
      default: return '/kwitansi/honor';
    }
  };

  // Load Firestore stats (per-user, merged across honor/jasa/barang)
  React.useEffect(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) return;
    let honor = [], jasa = [], barang = [], legacyHonor = [];

    const recompute = () => {
      const items = [
        ...honor,
        ...jasa,
        ...barang,
        ...legacyHonor.map(x => ({ ...x, __source: 'legacy' })),
      ];
      items.sort((a, b) => {
        const da = toMs(a.createdAt) || (a.tanggal ? new Date(a.tanggal).getTime() : 0);
        const dbt = toMs(b.createdAt) || (b.tanggal ? new Date(b.tanggal).getTime() : 0);
        return dbt - da;
      });
      setTotalKwitansi(items.length);
      const sum = items.reduce((acc, it) => acc + toAmount(it), 0);
      setTotalNilai(sum);
      setLatest(items);
    };

    const unsubHonor = onSnapshot(query(collection(db, 'users', uid, 'laporan_honor')), (qs) => {
      honor = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      recompute();
    });
    const unsubJasa = onSnapshot(query(collection(db, 'users', uid, 'laporan_jasa')), (qs) => {
      jasa = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      recompute();
    });
    const unsubBarang = onSnapshot(query(collection(db, 'users', uid, 'laporan_barang')), (qs) => {
      barang = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      recompute();
    });
    // legacy honor created before per-user migration
    const unsubLegacyHonor = onSnapshot(
      query(collection(db, 'laporan_honor'), where('type','==','kwitansi-honor'), where('createdBy','==', uid)),
      (qs) => { legacyHonor = qs.docs.map(d => ({ id: d.id, ...d.data() })); recompute(); }
    );

    return () => {
      try { unsubHonor(); } catch {}
      try { unsubJasa(); } catch {}
      try { unsubBarang(); } catch {}
      try { unsubLegacyHonor(); } catch {}
    };
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Header />

      <main className="container py-3">
        <h3 className="fw-medium mb-4">Selamat datang di Kwitansi DPMD Kabupaten Nganjuk, {displayName}.</h3>
        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-4">
            <div className="card text-bg-secondary h-100 shadow-sm">
              <div className="card-body d-flex flex-column justify-content-center text-center">
                <div className="small text-uppercase opacity-75 fw-semibold">Total Kwitansi</div>
                <div className="display-6 fw-bold mt-2" style={{fontSize:'2.2rem'}}>{totalKwitansi ?? '-'}</div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="card text-bg-secondary h-100 shadow-sm">
              <div className="card-body d-flex flex-column justify-content-center text-center">
                <div className="small text-uppercase opacity-75 fw-semibold">Total Nilai Kwitansi</div>
                <div className="display-6 fw-bold mt-2" style={{fontSize:'2.0rem'}}>{formatIDR(totalNilai)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card shadow-sm">
          <div className="card-header py-2 fw-semibold d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>Daftar Kwitansi Terbaru</span>
            <div className="d-flex flex-wrap align-items-center gap-2">
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
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Cari (jenis/kepada/kode rek)"
                style={{ width: 220 }}
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
              <label className="small mb-0" htmlFor="df">Dari</label>
              <input
                id="df"
                type="date"
                className="form-control form-control-sm"
                style={{ width: 150 }}
                value={dateFromDraft}
                onChange={(e) => setDateFromDraft(e.target.value)}
              />
              <label className="small mb-0" htmlFor="dt">Sampai</label>
              <input
                id="dt"
                type="date"
                className="form-control form-control-sm"
                style={{ width: 150 }}
                value={dateToDraft}
                onChange={(e) => setDateToDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearch((searchDraft||"").trim());
                  setDateFrom(dateFromDraft);
                  setDateTo(dateToDraft);
                }}
              >Cari</button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearch(''); setDateFrom(''); setDateTo('');
                  setSearchDraft(''); setDateFromDraft(''); setDateToDraft('');
                }}
              >Reset</button>
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
                      <th style={{width:'120px'}} className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(function(){
                      const q = (search||'').trim().toLowerCase();
                      const fromMs = dateFrom ? new Date(dateFrom+'T00:00:00').getTime() : null;
                      const toMsLimit = dateTo ? new Date(dateTo+'T23:59:59.999').getTime() : null;
                      const filtered = latest.filter(row => {
                        const dms = toMs(row.createdAt) || (row.tanggal ? new Date(row.tanggal).getTime() : 0);
                        if (fromMs!==null && dms < fromMs) return false;
                        if (toMsLimit!==null && dms > toMsLimit) return false;
                        if (!q) return true;
                        const kepada = row?.signatures?.penerima?.nama || row?.terimaDari || '';
                        const jenis = toFriendlyType(row.type) || '';
                        const kode = row?.kodeRek || '';
                        const hay = `${kepada} ${jenis} ${kode}`.toLowerCase();
                        return hay.includes(q);
                      });
                      return filtered.slice(0, pageSize).map(row => {
                        const kepada = row?.signatures?.penerima?.nama || row?.terimaDari || '-';
                        const to = routeForType(row.type);
                        const state = row.type === 'kwitansi-honor'
                          ? { editId: row.id, payload: row, source: row.__source }
                          : { prefill: row };
                        return (
                          <tr key={row.id}>
                            <td>{toLocaleDate(row)}</td>
                            <td>{toFriendlyType(row.type)}</td>
                            <td>{kepada}</td>
                            <td className="text-end">{formatIDR(toAmount(row))}</td>
                            <td className="text-end">
                              <Link to={to} state={state} className="btn btn-outline-secondary btn-sm">Lihat Detail</Link>
                            </td>
                          </tr>
                        );
                      });
                    })()}
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
