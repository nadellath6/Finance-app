import React, { useEffect, useState, useCallback } from 'react';
import Header from '../layout/Header';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/ToastProvider';
import * as XLSX from 'xlsx';

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
  return () => { try { unsub(); } catch (e) { console.warn('unsubscribe error (LaporanJasa):', e); } };
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

  const handleExportExcel = useCallback(() => {
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

    const dataToExport = filtered.map((r, idx) => {
      const sig = r.signatures || {};
      const pengguna = sig.pengguna || {};
      const pptk = sig.pptk || {};
      const bendahara = sig.bendahara || {};
      const penerima = sig.penerima || {};
      return {
        'No': filtered.length - idx,
        'No Rek': r.kodeRek || '-',
        'Untuk Pembayaran': r.untukPembayaran || '-',
        'Nota': r.notaPembayaran || '',
        'PPh 21': r.pph21 || '',
        'PPh 22': r.pph22 || '',
        'PPh 23': r.pph23 || '',
        'PPN': r.ppn || '',
        'PAD': r.pad || '',
        'PA': pengguna.nama || '-',
        'NIP PA': pengguna.nip || '-',
        'PPTK': pptk.nama || '-',
        'NIP PPTK': pptk.nip || '-',
        'Bendahara': bendahara.nama || '-',
        'NIP Bendahara': bendahara.nip || '-',
        'Penerima': penerima.nama || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Jasa');
    XLSX.writeFile(wb, `Laporan_Jasa_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data berhasil diekspor ke Excel');
  }, [rows, search, toast]);

  return (
    <div className="dashboard-wrapper">
      <Header />
      <div className="container py-3">
        <div className="mb-3 text-center">
          <h4 className="mb-2">Laporan Jasa</h4>
          <div className="d-flex justify-content-center">
            <div className="card shadow-sm" style={{ maxWidth: 320 }}>
              <div className="card-body py-2">
                <div className="small text-muted">Jumlah Data</div>
                <div className="fs-5 fw-semibold">{rows.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-3">
          <label className="small mb-0 me-1" htmlFor="lj-page-size">Tampilkan</label>
          <select id="lj-page-size" className="form-select form-select-sm" style={{ width: 90 }} value={pageSize} onChange={(e)=> setPageSize(Number(e.target.value))}>
            {[5,10,20,50,100].map(n => (<option key={n} value={n}>{n}</option>))}
          </select>
          <input type="text" className="form-control form-control-sm" placeholder="Cari (rek/pembayaran/nama/NIP)" style={{ width: 240 }} value={searchDraft} onChange={(e)=> setSearchDraft(e.target.value)} />
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=> setSearch((searchDraft||'').trim())}>Cari</button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=> { setSearch(''); setSearchDraft(''); }}>Reset</button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=> navigate('/kwitansi/jasa')}>+ Tambah</button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExportExcel}>Export Excel</button>
        </div>
        {loading && <div>Memuat…</div>}
        {error && <div className="text-danger small mb-2">{error}</div>}
        {!loading && !error && (
          <div className="table-responsive">
            <table className="table table-sm table-hover table-striped table-bordered mb-0 align-middle">
              <colgroup>
                <col style={{ width: '56px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '520px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '120px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{width:'40px', backgroundColor: '#e9ecef'}}>No</th>
                  <th style={{backgroundColor: '#e9ecef'}}>No Rek</th>
                  <th style={{backgroundColor: '#e9ecef'}}>Untuk Pembayaran</th>
                  <th style={{backgroundColor: '#e9ecef'}}>Nota</th>
                  <th style={{backgroundColor: '#e9ecef'}}>PPh 21</th>
                  <th style={{backgroundColor: '#e9ecef'}}>PPh 22</th>
                  <th style={{backgroundColor: '#e9ecef'}}>PPh 23</th>
                  <th style={{backgroundColor: '#e9ecef'}}>PPN</th>
                  <th style={{backgroundColor: '#e9ecef'}}>PAD</th>
                  <th style={{backgroundColor: '#e9ecef'}}>PA</th>
                  <th style={{backgroundColor: '#e9ecef'}}>NIP PA</th>
                  <th style={{backgroundColor: '#e9ecef'}}>PPTK</th>
                  <th style={{backgroundColor: '#e9ecef'}}>NIP PPTK</th>
                  <th style={{backgroundColor: '#e9ecef'}}>Bendahara</th>
                  <th style={{backgroundColor: '#e9ecef'}}>NIP Bendahara</th>
                  <th style={{backgroundColor: '#e9ecef'}}>Penerima</th>
                  <th style={{width:'120px', backgroundColor: '#e9ecef'}}>Aksi</th>
                </tr>
              </thead>
              <tbody className="text-start">
                {rows.length === 0 && (
                  <tr><td colSpan={17} className="text-center text-muted">Belum ada data</td></tr>
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
                    return (<tr><td colSpan={17} className="text-center text-muted">Tidak ada data yang cocok</td></tr>);
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
                        <td className="text-wrap" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.untukPembayaran || '-'}</td>
                        <td>{r.notaPembayaran ? formatNumberID(r.notaPembayaran) : ''}</td>
                        <td>{r.pph21 ? formatNumberID(r.pph21) : ''}</td>
                        <td>{r.pph22 ? formatNumberID(r.pph22) : ''}</td>
                        <td>{r.pph23 ? formatNumberID(r.pph23) : ''}</td>
                        <td>{r.ppn ? formatNumberID(r.ppn) : ''}</td>
                        <td>{r.pad ? formatNumberID(r.pad) : ''}</td>
                        <td>{pengguna.nama || '-'}</td>
                        <td>{pengguna.nip || '-'}</td>
                        <td>{pptk.nama || '-'}</td>
                        <td>{pptk.nip || '-'}</td>
                        <td>{bendahara.nama || '-'}</td>
                        <td>{bendahara.nip || '-'}</td>
                        <td>{penerima.nama || '-'}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => handleEdit(r)}>Edit</button>
                            <button type="button" className="btn btn-outline-secondary btn-sm" disabled={deletingId===r.id} onClick={() => handleDelete(r)}>
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
