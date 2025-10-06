import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import KwitansiPreview from "./KwitansiPreview";
import "./KwitansiJasa.css";

// Chrome-style input as a stable top-level component to prevent remounting on each parent render
const ChromeInput = React.memo(({ placeholder = "", value, onChange, type = "text", required = false }) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ 
          width: "100%", 
          padding: "12px", 
          border: "1px solid #dadce0", 
          borderRadius: "4px",
          fontSize: "16px",
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "Roboto, sans-serif",
          color: "#202124",
          backgroundColor: "#fff"
        }}
        required={required}
        onFocus={(e) => e.target.style.borderColor = "#1a73e8"}
        onBlur={(e) => e.target.style.borderColor = "#dadce0"}
      />
    </div>
  );
});

function KwitansiJasa() {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // State untuk form data
  const [formData, setFormData] = useState({
    // Payment Information
    noRekPembayaran: "",
    lembar: "",
    buktiKasNomor: "",
    
    // Personnel Information
    penerima: "",
    penggunaAnggaran: "",
    nipPenggunaAnggaran: "",
    namaPptk: "",
    nipPptk: "",
    namaBendahara: "",
    nipBendahara: "",
    
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

  // Helper function to update form data without causing re-renders
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, price: 0 }]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    setFormData(prev => {
      if (prev.items.length <= 1) return prev;
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  };

  // Update item
  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
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
        type: "jasa",
        subtotal,
        tax,
        total,
        createdAt: new Date()
      });
      alert("Kwitansi Jasa berhasil disimpan!");
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handlePreview = () => {
    const { subtotal, tax, total } = calculateTotal();
    setPreviewData({
      ...formData,
      type: "jasa",
      subtotal,
      tax,
      total,
      receiptNumber: `JSA-${Date.now()}`
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
    <div className="kj-container">
      <h2 className="kj-title">Kwitansi Jasa</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Form Fields */}
        <div>
          <h3 className="kj-section-title">Detail pembayaran</h3>
          <ChromeInput
            placeholder="No. Rek Pembayaran"
            value={formData.noRekPembayaran}
            onChange={(e) => updateFormData('noRekPembayaran', e.target.value)}
            required={true}
          />

          <div className="kj-grid-2">
            <div className="kj-field">
              <input
                className="kj-input"
                type="number"
                placeholder="Lembar"
                value={formData.lembar}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return updateFormData('lembar', "");
                  const n = parseInt(v, 10);
                  updateFormData('lembar', isNaN(n) ? "" : Math.max(1, n));
                }}
              />
            </div>
            <div className="kj-field">
              <input
                className="kj-input"
                type="text"
                placeholder="Bukti Kas Nomor"
                value={formData.buktiKasNomor}
                onChange={(e) => updateFormData('buktiKasNomor', e.target.value)}
              />
            </div>
          </div>
          
          <ChromeInput placeholder="Penerima" value={formData.penerima} onChange={(e) => updateFormData('penerima', e.target.value)} required={true} />
          
          <ChromeInput placeholder="Pengguna Anggaran" value={formData.penggunaAnggaran} onChange={(e) => updateFormData('penggunaAnggaran', e.target.value)} required={true} />
          
          <ChromeInput placeholder="NIP Pengguna Anggaran" value={formData.nipPenggunaAnggaran} onChange={(e) => updateFormData('nipPenggunaAnggaran', e.target.value)} required={true} />
          
          <ChromeInput placeholder="Nama PPTK" value={formData.namaPptk} onChange={(e) => updateFormData('namaPptk', e.target.value)} required={true} />
          
          <ChromeInput placeholder="NIP PPTK" value={formData.nipPptk} onChange={(e) => updateFormData('nipPptk', e.target.value)} required={true} />
          
          <ChromeInput placeholder="Nama Bendahara" value={formData.namaBendahara} onChange={(e) => updateFormData('namaBendahara', e.target.value)} required={true} />
          
          <ChromeInput placeholder="NIP Bendahara" value={formData.nipBendahara} onChange={(e) => updateFormData('nipBendahara', e.target.value)} required={true} />
          
          <ChromeInput placeholder="Nama Pelanggan" value={formData.customerName} onChange={(e) => updateFormData('customerName', e.target.value)} required={true} />
          
          <ChromeInput placeholder="Tanggal" type="date" value={formData.date} onChange={(e) => updateFormData('date', e.target.value)} required={true} />
        </div>

        <div className="kj-items-header">
          <h3 className="kj-section-title" style={{ margin: 0 }}>Item Jasa</h3>
            <button
              type="button"
              onClick={addItem}
              className="kj-btn kj-btn-primary"
            >
              Tambah Item
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="kj-item-card">
              <div className="kj-field">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Deskripsi item jasa"
                  className="kj-input"
                  required
                />
              </div>
              <div className="kj-item-row">
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Kuantitas"
                    className="kj-input"
                    min="1"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="Harga Satuan"
                    className="kj-input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="kj-item-actions">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="kj-btn kj-btn-danger"
                    disabled={formData.items.length === 1}
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <div className="kj-item-total">
                Total: Rp {(item.quantity * item.price).toLocaleString('id-ID')}
              </div>
            </div>
          ))}

        {/* Tax Settings */}
        <div style={{ marginTop: "24px" }}>
          <h3 className="kj-section-title">Pengaturan Pajak</h3>
          
          <div style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "16px", color: "#202124" }}>
              <input
                type="radio"
                name="taxSetting"
                value="no-tax"
                checked={formData.taxSetting === 'no-tax'}
                onChange={(e) => setFormData(prev => ({ ...prev, taxSetting: e.target.value }))}
                style={{ marginRight: "8px", accentColor: "#1a73e8" }}
              />
              Tanpa Pajak
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "16px", color: "#202124" }}>
              <input
                type="radio"
                name="taxSetting"
                value="include-tax"
                checked={formData.taxSetting === 'include-tax'}
                onChange={(e) => setFormData(prev => ({ ...prev, taxSetting: e.target.value }))}
                style={{ marginRight: "8px", accentColor: "#1a73e8" }}
              />
              Termasuk Pajak
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "16px", color: "#202124" }}>
              <input
                type="radio"
                name="taxSetting"
                value="add-tax"
                checked={formData.taxSetting === 'add-tax'}
                onChange={(e) => setFormData(prev => ({ ...prev, taxSetting: e.target.value }))}
                style={{ marginRight: "8px", accentColor: "#1a73e8" }}
              />
              Tambah Pajak
            </label>
          </div>

          {formData.taxSetting !== 'no-tax' && (
            <ChromeInput
              placeholder="Persentase Pajak (%)"
              type="number"
              value={formData.taxPercentage}
              onChange={(e) => setFormData(prev => ({ ...prev, taxPercentage: parseFloat(e.target.value) || 0 }))}
            />
          )}
        </div>

        <div className="kj-field">
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="kj-select"
            required
          >
            <option value="">Pilih Metode Pembayaran</option>
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer Bank</option>
            <option value="check">Cek</option>
            <option value="credit">Kredit</option>
          </select>
        </div>

        <div className="kj-field">
          <textarea
            value={formData.notes}
            onChange={(e) => updateFormData('notes', e.target.value)}
            placeholder="Catatan tambahan (opsional)"
            className="kj-textarea"
            style={{ minHeight: "80px", resize: "vertical" }}
          />
        </div>
        
        {/* Total Summary */}
        <div className="kj-total-card">
          <h3 className="kj-section-title">Total</h3>
          
          <div className="kj-total-row">
            <span>Subtotal:</span>
            <span style={{ fontWeight: "500", color: "#202124" }}>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          
          {formData.taxSetting !== 'no-tax' && (
            <div className="kj-total-row">
              <span>Pajak ({formData.taxPercentage}%):</span>
              <span style={{ fontWeight: "500", color: "#202124" }}>Rp {tax.toLocaleString('id-ID')}</span>
            </div>
          )}
          
          <div className="kj-total-amount">
            <span>Total:</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="kj-actions">
          <button
            type="button"
            onClick={handlePreview}
            className="kj-btn kj-btn-success"
            style={{ flex: 1 }}
          >
            Preview
          </button>
          <button
            type="submit"
            className="kj-btn kj-btn-primary"
            style={{ flex: 1 }}
          >
            Simpan Kwitansi
          </button>
        </div>
      </form>
    </div>
  );
}

export default KwitansiJasa;
