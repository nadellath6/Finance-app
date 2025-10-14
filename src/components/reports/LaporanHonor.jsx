import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from '../layout/Header';

function formatNumberID(n) {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '';
  return new Intl.NumberFormat('id-ID').format(Number(n));
}

export default function LaporanHonor(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Gunakan filter saja tanpa orderBy untuk menghindari kebutuhan index komposit
      const q = query(
        collection(db, 'laporan_honor'),
        where('type', '==', 'kwitansi-honor')
      );
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sortir di client berdasarkan createdAt desc jika tersedia
        data.sort((a, b) => {
          const ta = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
        setRows(data);
        setLoading(false);
      }, (err) => {
        console.error('LaporanHonor snapshot error:', err);
        // Beri pesan yang lebih informatif jika butuh index komposit
        const msg = String(err?.message || '');
        if (msg.includes('index') || msg.includes('FAILED_PRECONDITION')) {
          setError('Gagal memuat data (perlu index Firestore). Coba muat ulang setelah menghapus urutan server atau buat index komposit.');
        } else if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
          setError('Gagal memuat data (izin Firestore ditolak). Periksa aturan Firestore.');
        } else {
          setError('Gagal memuat data');
        }
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error('LaporanHonor init error:', e);
      setError('Gagal memuat data');
      setLoading(false);
    }
  }, []);

  const handleEdit = useCallback((row) => {
    // Kirim data ke halaman Kwitansi Honor untuk diedit
    navigate('/kwitansi/honor', { state: { editId: row.id, payload: row } });
  }, [navigate]);

  const handleDelete = useCallback(async (row) => {
    if (!row?.id) return;
    const ok = window.confirm('Hapus data ini?');
    if (!ok) return;
    try {
      setDeletingId(row.id);
      await deleteDoc(doc(db, 'laporan_honor', row.id));
    } catch (e) {
      console.error('Gagal hapus:', e);
      alert('Gagal menghapus data.');
    } finally {
      setDeletingId('');
    }
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Header />
      <div className="container py-3">
      {/* Judul Laporan + Aksi */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">Laporan Honor <small className="text-muted">({rows.length} data)</small></h4>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/kwitansi/honor')}>
            + Tambah
          </button>
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
                <tr>
                  <td colSpan={12} className="text-center text-muted">Belum ada data</td>
                </tr>
              )}
              {rows.map((r, idx) => {
                const sig = r.signatures || {};
                const pengguna = sig.pengguna || {};
                const pptk = sig.pptk || {};
                const bendahara = sig.bendahara || {};
                const penerima = sig.penerima || {};
                return (
                  <tr key={r.id}>
                    <td>{idx + 1}</td>
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
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
