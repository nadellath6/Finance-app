import React, { useEffect, useState, useCallback } from 'react';
import Header from '../layout/Header';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/ToastProvider';

function formatNumberID(n) {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '';
  return new Intl.NumberFormat('id-ID').format(Number(n));
}

export default function LaporanJasa(){
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  useEffect(() => {
    try {
      const uid = auth?.currentUser?.uid;
      if (!uid) { setRows([]); setLoading(false); return; }
      const qref = query(collection(db, 'users', uid, 'laporan_jasa'), where('type','==','kwitansi-jasa'));
      const unsub = onSnapshot(qref, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.createdAt?.seconds || a.createdAt?.toMillis?.() || (a.createdAt?.toDate ? a.createdAt.toDate().getTime()/1000 : 0);
          const tb = b.createdAt?.seconds || b.createdAt?.toMillis?.() || (b.createdAt?.toDate ? b.createdAt.toDate().getTime()/1000 : 0);
          return tb - ta;
        });
        setRows(list);
        setLoading(false);
      }, (err) => {
        console.error('LaporanJasa error:', err);
        setError('Gagal memuat data');
        setLoading(false);
      });
      return () => { try { unsub(); } catch {} };
    } catch (e) {
      console.error('LaporanJasa init error:', e);
      setError('Gagal memuat data');
      setLoading(false);
    }
  }, []);

  const handleEdit = useCallback((row) => {
    navigate('/kwitansi/jasa', { state: { prefill: row } });
  }, [navigate]);

  const handleDelete = useCallback(async (row) => {
    if (!row?.id) return;
    const ok = window.confirm('Hapus data ini?');
    if (!ok) return;
    try {
      setDeletingId(row.id);
      const uid = auth?.currentUser?.uid;
      if (!uid) throw new Error('User belum login');
      await deleteDoc(doc(db, 'users', uid, 'laporan_jasa', row.id));
      toast.success('Data berhasil dihapus');
    } catch (e) {
      console.error('Gagal hapus:', e);
      toast.error('Gagal menghapus data.');
    } finally {
      setDeletingId('');
    }
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Header />
      <div className="container py-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h4 className="mb-0">Laporan Jasa <small className="text-muted">({rows.length} data)</small></h4>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <label className="small mb-0 me-1" htmlFor="lj-page-size">Tampilkan</label>
            <select id="lj-page-size" className="form-select form-select-sm" style={{ width: 90 }} value={pageSize} onChange={(e)=> setPageSize(Number(e.target.value))}>
              {[5,10,20,50,100].map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
            <input type="text" className="form-control form-control-sm" placeholder="Cari (rek/pembayaran/nama/NIP)" style={{ width: 240 }} value={searchDraft} onChange={(e)=> setSearchDraft(e.target.value)} />
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=> setSearch((searchDraft||'').trim())}>Cari</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=> { setSearch(''); setSearchDraft(''); }}>Reset</button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=> navigate('/kwitansi/jasa')}>+ Tambah</button>
          </div>
        </div>
        {loading && <div>Memuat…</div>}
        {error && <div className="text-danger small mb-2">{error}</div>}
        {!loading && !error && (
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{width:'40px'}}>No</th>
                  <th>No Rek</th>
                  <th>Untuk Pembayaran</th>
                  <th>Nota</th>
                  <th>PPH 21</th>
                  <th>Nama Pengguna Anggaran</th>
                  <th>NIP Pengguna Anggaran</th>
                  <th>Nama PPTK</th>
                  <th>NIP PPTK</th>
                  <th>Nama Bendahara</th>
                  <th>NIP Bendahara</th>
                  <th>Nama Penerima</th>
                  <th style={{width:'120px'}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={13} className="text-center text-muted">Belum ada data</td></tr>
                )}
                {(function(){
                  const q = (search||'').toLowerCase();
                  const filtered = !q ? rows : rows.filter((r) => {
                    const sig = r.signatures || {};
                    const pengguna = sig.pengguna || {};
                    const pptk = sig.pptk || {};
                    const bendahara = sig.bendahara || {};
                    const penerima = sig.penerima || {};
                    const hay = [r.kodeRek, r.untukPembayaran, pengguna.nama, pengguna.nip, pptk.nama, pptk.nip, bendahara.nama, bendahara.nip, penerima.nama].filter(Boolean).join(' ').toLowerCase();
                    return hay.includes(q);
                  });
                  const numbered = filtered.map((r, i) => ({ r, nomor: filtered.length - i }));
                  const pageRows = numbered.slice(0, pageSize);
                  if (pageRows.length === 0) {
                    return (<tr><td colSpan={13} className="text-center text-muted">Tidak ada data yang cocok</td></tr>);
                  }
                  return pageRows.map(({ r, nomor }) => {
                    const sig = r.signatures || {};
                    const pengguna = sig.pengguna || {};
                    const pptk = sig.pptk || {};
                    const bendahara = sig.bendahara || {};
                    const penerima = sig.penerima || {};
                    return (
                      <tr key={r.id}>
                        <td>{nomor}</td>
                        <td>{r.kodeRek || '-'}</td>
                        <td>{r.untukPembayaran || '-'}</td>
                        <td className="text-end">{r.notaPembayaran ? formatNumberID(r.notaPembayaran) : ''}</td>
                        <td className="text-end">{r.pph21 ? formatNumberID(r.pph21) : ''}</td>
                        <td>{pengguna.nama || '-'}</td>
                        <td>{pengguna.nip || '-'}</td>
                        <td>{pptk.nama || '-'}</td>
                        <td>{pptk.nip || '-'}</td>
                        <td>{bendahara.nama || '-'}</td>
                        <td>{bendahara.nip || '-'}</td>
                        <td>{penerima.nama || '-'}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleEdit(r)}>Edit</button>
                            <button type="button" className="btn btn-outline-danger btn-sm" disabled={deletingId===r.id} onClick={() => handleDelete(r)}>
                              {deletingId===r.id ? 'Menghapus…' : 'Hapus'}
                            </button>
                          </div>
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
  );
}
