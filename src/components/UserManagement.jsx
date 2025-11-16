import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/ToastProvider';
import Header from './layout/Header';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
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
          createdAt: data.createdAt || new Date().toISOString()
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
      
      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th style={{ backgroundColor: '#e9ecef' }}>No</th>
              <th style={{ backgroundColor: '#e9ecef' }}>Username</th>
              <th style={{ backgroundColor: '#e9ecef' }}>Email</th>
              <th style={{ backgroundColor: '#e9ecef' }}>Role</th>
              <th style={{ backgroundColor: '#e9ecef' }}>Dibuat</th>
              <th style={{ backgroundColor: '#e9ecef' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
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
                    <span className="badge bg-secondary">{user.role === 'Bendahara' ? 'User' : user.role}</span>
                  )}
                </td>
                <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                <td>
                  {editingUser?.id === user.id ? (
                    <>
                      <button 
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={handleSaveRole}
                      >
                        Simpan
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setEditingUser(null)}
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => handleEditRole(user)}
                      >
                        Ubah Role
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={user.email === 'admin1@gmail.com'}
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="alert alert-info">
          Belum ada pengguna terdaftar.
        </div>
      )}
      </div>
    </>
  );
}
