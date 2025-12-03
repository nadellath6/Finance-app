import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/ToastProvider';
import Header from './layout/Header';
import { exportUserData, downloadBackupFile, restoreUserData, validateBackupFile } from '../services/backupService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if current user is admin
        const userDoc = await getDocs(collection(db, 'users'));
        const currentUser = userDoc.docs.find(doc => doc.id === user.uid);
        if (currentUser && currentUser.data().role === 'admin') {
          setCurrentUserRole('admin');
          setCurrentUserEmail(user.email);
          fetchUsers();
        } else {
          // Not admin, redirect to dashboard
          error('Akses ditolak. Anda bukan admin.');
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, error]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Update user lama yang tidak punya createdAt
        if (!data.createdAt) {
          updateDoc(doc.ref, { createdAt: new Date().toISOString() }).catch(console.error);
        }
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || new Date().toISOString(),
          lastBackup: data.lastBackup || null
        };
      });
      setUsers(userList);
    } catch (err) {
      error('Gagal memuat daftar pengguna');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    
    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, { role: newRole });
      success('Role berhasil diubah');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      error('Gagal mengubah role');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === 'admin1@gmail.com') {
      error('Admin utama tidak dapat dihapus');
      return;
    }
    if (userEmail === currentUserEmail) {
      error('Anda tidak dapat menghapus akun sendiri');
      return;
    }
    if (!confirm(`Hapus pengguna ${userEmail}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      success('Pengguna berhasil dihapus');
      fetchUsers();
    } catch (err) {
      error('Gagal menghapus pengguna');
      console.error(err);
    }
  };

  const handleResetPassword = async (userEmail) => {
    if (!confirm(`Kirim email reset password ke ${userEmail}?`)) return;
    
    try {
      await sendPasswordResetEmail(auth, userEmail);
      success(`Email reset password berhasil dikirim ke ${userEmail}`);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/network-request-failed') {
        error('Tidak ada koneksi internet');
      } else {
        error('Gagal mengirim email reset password');
      }
    }
  };

  const handleBackup = async (user) => {
    try {
      success('Memulai backup data...');
      
      // Export data user
      const backup = await exportUserData(user.id);
      
      // Download file JSON
      downloadBackupFile(backup, user.email);
      
      // Update lastBackup timestamp
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        lastBackup: new Date().toISOString()
      });
      
      success(`Backup data ${user.email} berhasil diunduh!`);
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      console.error('Backup failed:', err);
      error('Gagal backup data: ' + err.message);
    }
  };

  const handleRestore = (user) => {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        // Validate and parse file
        const backup = await validateBackupFile(file);
        
        // Show confirmation with stats
        const honorCount = backup.data.laporan_honor?.length || 0;
        const jasaCount = backup.data.laporan_jasa?.length || 0;
        const barangCount = backup.data.laporan_barang?.length || 0;
        const totalCount = honorCount + jasaCount + barangCount;
        
        const confirmMsg = 
          `Restore data dari backup?\n\n` +
          `User: ${user.email}\n` +
          `Tanggal Backup: ${new Date(backup.exportDate).toLocaleString('id-ID')}\n\n` +
          `Data yang akan di-restore:\n` +
          `- Honor: ${honorCount} dokumen\n` +
          `- Jasa: ${jasaCount} dokumen\n` +
          `- Barang: ${barangCount} dokumen\n` +
          `Total: ${totalCount} dokumen\n\n` +
          `⚠️ PERHATIAN: Data akan DITAMBAHKAN (bukan mengganti data lama)`;
        
        if (!confirm(confirmMsg)) return;
        
        success('Memulai restore data...');
        
        // Restore data
        const result = await restoreUserData(user.id, backup);
        
        success(
          `Restore berhasil! Total: ${result.total} data\n` +
          `(Honor: ${result.restored.honor}, Jasa: ${result.restored.jasa}, Barang: ${result.restored.barang})`
        );
        
      } catch (err) {
        console.error('Restore error:', err);
        error('Gagal restore: ' + err.message);
      }
    };
    input.click();
  };

  // Filter users berdasarkan search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.displayName || user.username || '').toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.role || '').toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (currentUserRole !== 'admin') {
    return null;
  }

  return (
    <>
      <Header />
      <div className="container mt-4">
        <h2 className="mb-4 text-center">Manajemen Pengguna</h2>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari berdasarkan username, email, atau role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setSearchQuery('')}
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="col-md-6 text-end">
          <strong>Total Pengguna:</strong> {filteredUsers.length} {searchQuery && `dari ${users.length}`}
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="table table-bordered table-sm table-hover">
          <thead className="table-light">
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Dibuat</th>
              <th>Last Backup</th>
              <th>Aksi</th>
              <th>Aksi Backup</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted">
                  {searchQuery ? 'Tidak ada hasil yang sesuai dengan pencarian' : 'Belum ada pengguna terdaftar'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.username || user.displayName || '-'}</td>
                <td>{user.email}</td>
                <td>
                  {editingUser?.id === user.id ? (
                    <select 
                      className="form-select form-select-sm" 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  ) : (
                    <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                      {user.role === 'Bendahara' ? 'User' : user.role}
                    </span>
                  )}
                </td>
                <td>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : '-'}
                </td>
                <td>
                  {user.lastBackup ? (
                    <small className="text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      {new Date(user.lastBackup).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  ) : (
                    <small className="text-muted">Never</small>
                  )}
                </td>
                <td>
                  {editingUser?.id === user.id ? (
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-success"
                        onClick={handleSaveRole}
                      >
                        Simpan
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setEditingUser(null)}
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => handleEditRole(user)}
                        title="Ubah Role"
                      >
                        Role
                      </button>
                      <button 
                        className="btn btn-outline-warning"
                        onClick={() => handleResetPassword(user.email)}
                        title="Reset Password"
                      >
                        Reset
                      </button>
                      <button 
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={user.email === 'admin1@gmail.com' || user.email === currentUserEmail}
                        title={user.email === 'admin1@gmail.com' ? 'Admin utama tidak dapat dihapus' : user.email === currentUserEmail ? 'Tidak dapat menghapus akun sendiri' : 'Hapus'}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleBackup(user)}
                      title="Export & Download Backup"
                    >
                      Backup
                    </button>
                    <button 
                      className="btn btn-info"
                      onClick={() => handleRestore(user)}
                      title="Upload & Restore Backup"
                    >
                      Restore
                    </button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
