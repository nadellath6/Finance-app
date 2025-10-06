import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import KwitansiPreview from "./KwitansiPreview";

function KwitansiBarang() {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // State untuk form data
  const [formData, setFormData] = useState({
    // Business Information
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    
    // Bill To
    customerName: "",
    date: new Date().toISOString().split('T')[0],
    
    // Items
    items: [
      { description: "", quantity: 1, price: 0 }
    ],
    
    // Tax
    taxSetting: "no-tax", // no-tax, include-tax, add-tax
    taxPercentage: 11,
    
    // Payment
    paymentMethod: "",
    
    // Notes
    notes: ""
  });

  // Add item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, price: 0 }]
    });
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  // Update item
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  // Calculate totals
  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    let tax = 0;
    let total = subtotal;
    
    if (formData.taxSetting === "include-tax") {
      // Tax sudah termasuk dalam harga
      const taxRate = formData.taxPercentage / 100;
      tax = subtotal * taxRate / (1 + taxRate);
      total = subtotal;
    } else if (formData.taxSetting === "add-tax") {
      // Tax ditambahkan ke harga
      tax = subtotal * (formData.taxPercentage / 100);
      total = subtotal + tax;
    }
    
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subtotal, tax, total } = calculateTotal();
    
    try {
      await addDoc(collection(db, "kwitansi"), {
        ...formData,
        type: "barang",
        subtotal,
        tax,
        total,
        createdAt: new Date()
      });
      alert("Kwitansi Barang berhasil disimpan!");
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handlePreview = () => {
    const { subtotal, tax, total } = calculateTotal();
    setPreviewData({
      ...formData,
      type: "barang",
      subtotal,
      tax,
      total,
      receiptNumber: `BRG-${Date.now()}`
    });
    setShowPreview(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('kwitansi-print').innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Kwitansi</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: A4; margin: 0; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSave = () => {
    handlePrint(); // For now, use print dialog where user can save as PDF
  };

  // Return preview if showPreview is true
  if (showPreview && previewData) {
    return (
      <KwitansiPreview
        data={previewData}
        onPrint={handlePrint}
        onSave={handleSave}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  const { subtotal, tax, total } = calculateTotal();

  // Return the main form
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#f8f9fa" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>📦 Kwitansi Barang</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Business Information */}
        <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "15px", color: "#495057", borderBottom: "2px solid #007bff", paddingBottom: "5px" }}>🏢 Informasi Bisnis</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Nama Bisnis</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Alamat</label>
              <input
                type="text"
                value={formData.businessAddress}
                onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
                required
              />
            </div>
          </div>
          
          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Telepon</label>
            <input
              type="text"
              value={formData.businessPhone}
              onChange={(e) => setFormData({...formData, businessPhone: e.target.value})}
              style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
              required
            />
          </div>
        </div>

        {/* Customer Information */}
        <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "15px", color: "#495057", borderBottom: "2px solid #28a745", paddingBottom: "5px" }}>👤 Informasi Pelanggan</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Nama Pelanggan</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
                required
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ color: "#495057", borderBottom: "2px solid #ffc107", paddingBottom: "5px", margin: "0" }}>📦 Item Barang</h3>
            <button
              type="button"
              onClick={addItem}
              style={{ padding: "8px 16px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              ➕ Tambah Item
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} style={{ marginBottom: "15px", padding: "15px", border: "1px solid #e9ecef", borderRadius: "6px", backgroundColor: "#f8f9fa" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Deskripsi</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                    placeholder="Misal: Laptop Dell"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Kuantitas</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Harga Satuan</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  style={{ padding: "10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  disabled={formData.items.length === 1}
                >
                  🗑️
                </button>
              </div>
              <div style={{ marginTop: "10px", textAlign: "right", fontWeight: "bold", color: "#495057" }}>
                Total: Rp {(item.quantity * item.price).toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>

        {/* Tax Settings */}
        <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "15px", color: "#495057", borderBottom: "2px solid #6f42c1", paddingBottom: "5px" }}>🧾 Pengaturan Pajak</h3>
          
          <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="taxSetting"
                value="no-tax"
                checked={formData.taxSetting === 'no-tax'}
                onChange={(e) => setFormData({...formData, taxSetting: e.target.value})}
                style={{ marginRight: "8px" }}
              />
              Tanpa Pajak
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="taxSetting"
                value="include-tax"
                checked={formData.taxSetting === 'include-tax'}
                onChange={(e) => setFormData({...formData, taxSetting: e.target.value})}
                style={{ marginRight: "8px" }}
              />
              Termasuk Pajak
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="taxSetting"
                value="add-tax"
                checked={formData.taxSetting === 'add-tax'}
                onChange={(e) => setFormData({...formData, taxSetting: e.target.value})}
                style={{ marginRight: "8px" }}
              />
              Tambah Pajak
            </label>
          </div>

          {formData.taxSetting !== 'no-tax' && (
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Persentase Pajak (%)</label>
              <input
                type="number"
                value={formData.taxPercentage}
                onChange={(e) => setFormData({...formData, taxPercentage: parseFloat(e.target.value) || 0})}
                style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px", width: "150px" }}
                min="0"
                max="100"
                step="0.1"
                placeholder="11"
              />
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "15px", color: "#495057", borderBottom: "2px solid #fd7e14", paddingBottom: "5px" }}>💳 Metode Pembayaran</h3>
          
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
            style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "16px" }}
            required
          >
            <option value="">Pilih Metode Pembayaran</option>
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer Bank</option>
            <option value="check">Cek</option>
            <option value="credit">Kredit</option>
          </select>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "15px", color: "#495057", borderBottom: "2px solid #20c997", paddingBottom: "5px" }}>📝 Catatan</h3>
          
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "100px", resize: "vertical" }}
            placeholder="Catatan tambahan untuk kwitansi..."
          />
        </div>

        {/* Total Summary */}
        <div style={{ marginBottom: "25px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "15px", color: "#495057", borderBottom: "2px solid #e83e8c", paddingBottom: "5px" }}>💰 Total</h3>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "16px" }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: "bold" }}>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          
          {formData.taxSetting !== 'no-tax' && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "16px" }}>
              <span>Pajak ({formData.taxPercentage}%):</span>
              <span style={{ fontWeight: "bold" }}>Rp {tax.toLocaleString('id-ID')}</span>
            </div>
          )}
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "bold", color: "#007bff", borderTop: "2px solid #007bff", paddingTop: "10px" }}>
            <span>Total:</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handlePreview}
            style={{ flex: "1", padding: "15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "bold" }}
          >
            📄 Preview
          </button>
          <button
            type="submit"
            style={{ flex: "1", padding: "15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "bold" }}
          >
            💾 Simpan Kwitansi
          </button>
        </div>
      </form>
    </div>
  );
}

export default KwitansiBarang;
