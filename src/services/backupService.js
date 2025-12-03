import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Export semua data kwitansi dari satu user
 * @param {string} userId - UID user yang akan dibackup
 * @returns {Object} - Data backup dalam format JSON
 */
export async function exportUserData(userId) {
  const backup = {
    userId,
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      laporan_honor: [],
      laporan_jasa: [],
      laporan_barang: []
    }
  };

  try {
    // Export laporan_honor
    const honorSnap = await getDocs(collection(db, 'users', userId, 'laporan_honor'));
    backup.data.laporan_honor = honorSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to ISO string
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
    }));

    // Export laporan_jasa
    const jasaSnap = await getDocs(collection(db, 'users', userId, 'laporan_jasa'));
    backup.data.laporan_jasa = jasaSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
    }));

    // Export laporan_barang
    const barangSnap = await getDocs(collection(db, 'users', userId, 'laporan_barang'));
    backup.data.laporan_barang = barangSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
    }));

    return backup;
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Gagal export data user: ' + error.message);
  }
}

/**
 * Download backup sebagai JSON file
 * @param {Object} backup - Data backup
 * @param {string} userEmail - Email user untuk nama file
 */
export function downloadBackupFile(backup, userEmail) {
  const filename = `backup_${userEmail.replace('@', '_').replace(/\./g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Restore data user dari backup file
 * @param {string} userId - UID user target
 * @param {Object} backupData - Data backup JSON
 * @returns {Object} - Statistics hasil restore
 */
export async function restoreUserData(userId, backupData) {
  // Validasi format backup
  if (!backupData.version || !backupData.data) {
    throw new Error('Format backup tidak valid');
  }

  // Warning jika backup dari user berbeda
  if (backupData.userId !== userId) {
    const confirm = window.confirm(
      `⚠️ PERHATIAN!\n\n` +
      `Backup ini milik user ID: ${backupData.userId}\n` +
      `Akan di-restore ke user ID: ${userId}\n\n` +
      `Apakah Anda yakin ingin melanjutkan?`
    );
    if (!confirm) {
      throw new Error('Restore dibatalkan oleh user');
    }
  }

  const stats = {
    honor: 0,
    jasa: 0,
    barang: 0
  };

  try {
    // Restore laporan_honor
    for (const docData of backupData.data.laporan_honor || []) {
      const data = { ...docData };
      const docId = data.id;
      delete data.id; // Hapus ID dari data
      
      // Convert ISO string back to Timestamp
      if (data.createdAt) {
        data.createdAt = Timestamp.fromDate(new Date(data.createdAt));
      }
      if (data.updatedAt) {
        data.updatedAt = Timestamp.fromDate(new Date(data.updatedAt));
      }
      
      await setDoc(doc(db, 'users', userId, 'laporan_honor', docId), data);
      stats.honor++;
    }

    // Restore laporan_jasa
    for (const docData of backupData.data.laporan_jasa || []) {
      const data = { ...docData };
      const docId = data.id;
      delete data.id;
      
      if (data.createdAt) data.createdAt = Timestamp.fromDate(new Date(data.createdAt));
      if (data.updatedAt) data.updatedAt = Timestamp.fromDate(new Date(data.updatedAt));
      
      await setDoc(doc(db, 'users', userId, 'laporan_jasa', docId), data);
      stats.jasa++;
    }

    // Restore laporan_barang
    for (const docData of backupData.data.laporan_barang || []) {
      const data = { ...docData };
      const docId = data.id;
      delete data.id;
      
      if (data.createdAt) data.createdAt = Timestamp.fromDate(new Date(data.createdAt));
      if (data.updatedAt) data.updatedAt = Timestamp.fromDate(new Date(data.updatedAt));
      
      await setDoc(doc(db, 'users', userId, 'laporan_barang', docId), data);
      stats.barang++;
    }

    return {
      success: true,
      restored: stats,
      total: stats.honor + stats.jasa + stats.barang
    };
  } catch (error) {
    console.error('Restore failed:', error);
    throw new Error('Gagal restore data: ' + error.message);
  }
}

/**
 * Validasi file backup sebelum restore
 * @param {File} file - File yang akan divalidasi
 * @returns {Promise<Object>} - Parsed backup data
 */
export async function validateBackupFile(file) {
  // Check file type
  if (!file.name.endsWith('.json')) {
    throw new Error('File harus berformat JSON');
  }

  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar (max 50MB)');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        
        // Validasi structure
        if (!backup.version || !backup.data) {
          reject(new Error('Format backup tidak valid'));
          return;
        }
        
        resolve(backup);
      } catch (error) {
        reject(new Error('File JSON tidak valid: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };
    
    reader.readAsText(file);
  });
}
