import React from "react";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getCountFromServer, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import "./Register.css"; // reuse variables and logo styles
import "./Dashboard.css";
import Header from "./layout/Header";

function Dashboard() {
  // navigation handled in Header
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || "Pengguna";
  const [totalKwitansi, setTotalKwitansi] = React.useState(null);
  const [latest, setLatest] = React.useState([]);

  // logout handled in Header

  // Load Firestore stats
  React.useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const coll = collection(db, "kwitansi");
        // total count (one-time)
        const snap = await getCountFromServer(coll);
        setTotalKwitansi(snap.data().count || 0);
        // latest 5 (live updates)
        const q = query(coll, orderBy("createdAt", "desc"), limit(5));
        unsub = onSnapshot(q, (qs) => {
          const items = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
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

      {/* Content */}
      <main className="dash-content">
        <h3 className="dash-section-title">Halo, selamat datang {displayName}</h3>

        <div className="dash-summary">
          <div className="summary-box">
            <div className="summary-title">Total Kwitansi</div>
            <div style={{fontSize:24, fontWeight:700, marginTop:8}}>{totalKwitansi ?? '-'}</div>
          </div>
        </div>

        <div className="dash-list">
          <div className="list-box" style={{flexDirection:'column'}}>
            <div className="summary-title" style={{marginBottom:10}}>Daftar Kwitansi Terbaru</div>
            {latest.length === 0 ? (
              <div style={{opacity:0.9}}>Belum ada data</div>
            ) : (
              <div style={{width:'100%'}}>
                <table style={{width:'100%', borderCollapse:'collapse', background:'#fff', color:'#333', borderRadius:4, overflow:'hidden'}}>
                  <thead>
                    <tr style={{background:'#f1f1f4', textAlign:'left'}}>
                      <th style={{padding:'8px 10px'}}>Tanggal</th>
                      <th style={{padding:'8px 10px'}}>Jenis</th>
                      <th style={{padding:'8px 10px'}}>Kepada</th>
                      <th style={{padding:'8px 10px', textAlign:'right'}}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((row) => (
                      <tr key={row.id} style={{borderTop:'1px solid #eee'}}>
                        <td style={{padding:'8px 10px'}}>{row.date || (row.createdAt?.toDate ? row.createdAt.toDate().toLocaleDateString('id-ID') : '-')}</td>
                        <td style={{padding:'8px 10px', textTransform:'capitalize'}}>{row.type || '-'}</td>
                        <td style={{padding:'8px 10px'}}>{row.customerName || '-'}</td>
                        <td style={{padding:'8px 10px', textAlign:'right'}}>Rp {Number(row.total||0).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
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
