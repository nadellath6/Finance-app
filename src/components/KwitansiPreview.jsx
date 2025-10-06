import React from "react";

function KwitansiPreview({ data, onPrint, onSave, onBack }) {
  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getReceiptTitle = () => {
    switch(data.type) {
      case 'honor': return 'Kwitansi Honorarium';
      case 'jasa': return 'Kwitansi Jasa';
      case 'barang': return 'Kwitansi Pembelian Barang';
      default: return 'Kwitansi';
    }
  };

  const a4Style = {
    width: '210mm',
    minHeight: '297mm',
    padding: '20mm',
    margin: '0 auto',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    lineHeight: '1.4',
    color: '#000'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #000',
    paddingBottom: '15px'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
  };

  const tdStyle = {
    padding: '8px',
    borderBottom: '1px solid #ddd',
    verticalAlign: 'top'
  };

  const labelStyle = {
    fontWeight: 'bold',
    width: '150px'
  };

  const itemTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    border: '1px solid #000'
  };

  const itemThStyle = {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #000',
    fontWeight: 'bold',
    textAlign: 'center'
  };

  const itemTdStyle = {
    padding: '8px',
    border: '1px solid #000',
    textAlign: 'center'
  };

  const signatureStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px',
    paddingTop: '20px'
  };

  const signatureBoxStyle = {
    textAlign: 'center',
    width: '200px'
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      {/* Action Buttons */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onBack}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          ← Kembali
        </button>
        <button 
          onClick={onPrint}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          🖨️ Print
        </button>
        <button 
          onClick={onSave}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          💾 Save PDF
        </button>
      </div>

      {/* Kwitansi A4 Paper */}
      <div id="kwitansi-print" style={a4Style}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>LEMBAR</h2>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Bukti Kas Nomor</h3>
          <h3 style={{ margin: '0', fontSize: '14px' }}>Kode Rekening: {data.receiptNumber}</h3>
        </div>

        {/* Receipt Details */}
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={{...tdStyle, ...labelStyle}}>Terima Dari</td>
              <td style={tdStyle}>: {data.customerName}</td>
            </tr>
            <tr>
              <td style={{...tdStyle, ...labelStyle}}>Uang Sejumlah</td>
              <td style={tdStyle}>: <strong>{formatRupiah(data.total)}</strong></td>
            </tr>
            <tr>
              <td style={{...tdStyle, ...labelStyle}}>Untuk Pembayaran</td>
              <td style={tdStyle}>: {getReceiptTitle()} - {data.items.map(item => item.description).join(', ')}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table style={itemTableStyle}>
          <thead>
            <tr>
              <th style={itemThStyle}>Uraian</th>
              <th style={itemThStyle}>Qty</th>
              <th style={itemThStyle}>Harga Satuan</th>
              <th style={itemThStyle}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td style={{...itemTdStyle, textAlign: 'left'}}>{item.description}</td>
                <td style={itemTdStyle}>{item.quantity}</td>
                <td style={itemTdStyle}>{formatRupiah(item.price)}</td>
                <td style={itemTdStyle}>{formatRupiah(item.quantity * item.price)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" style={{...itemTdStyle, fontWeight: 'bold', textAlign: 'right'}}>
                Netto Pembayaran
              </td>
              <td style={{...itemTdStyle, fontWeight: 'bold'}}>
                {formatRupiah(data.subtotal)}
              </td>
            </tr>
            {data.taxSetting !== 'no-tax' && (
              <>
                <tr>
                  <td colSpan="3" style={{...itemTdStyle, textAlign: 'right'}}>PPN</td>
                  <td style={itemTdStyle}>{formatRupiah(data.tax)}</td>
                </tr>
                <tr>
                  <td colSpan="3" style={{...itemTdStyle, fontWeight: 'bold', textAlign: 'right'}}>
                    Harga Setelah Pajak
                  </td>
                  <td style={{...itemTdStyle, fontWeight: 'bold'}}>
                    {formatRupiah(data.total)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* Notes */}
        {data.notes && (
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <strong>Catatan:</strong>
            <p style={{ margin: '5px 0', fontStyle: 'italic' }}>{data.notes}</p>
          </div>
        )}

        {/* Signature Section */}
        <div style={signatureStyle}>
          <div style={signatureBoxStyle}>
            <p style={{ margin: '0 0 5px 0' }}>Pengguna Anggaran</p>
            <div style={{ height: '80px', borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
            <p style={{ margin: '0', fontSize: '10px' }}>
              <strong>PUGUH HARJOTO, S STP, MM</strong><br/>
              NIP. 19760130 198003 1 001
            </p>
          </div>

          <div style={signatureBoxStyle}>
            <p style={{ margin: '0 0 5px 0' }}>PPTK</p>
            <div style={{ height: '80px', marginBottom: '5px' }}></div>
            <p style={{ margin: '0', fontSize: '10px' }}>
              Lunas dengan<br/>
              Bendahara
            </p>
          </div>

          <div style={signatureBoxStyle}>
            <p style={{ margin: '0 0 5px 0' }}>Nganjuk, {formatDate(data.date)}</p>
            <p style={{ margin: '0 0 5px 0' }}>Penerima</p>
            <div style={{ height: '80px', borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
            <p style={{ margin: '0', fontSize: '10px' }}>
              <strong>RIZKY AMELIA LUF DE WI, SE</strong><br/>
              NIP. 19870425 201003 2 026
            </p>
          </div>
        </div>

        {/* Bottom Signature */}
        <div style={{ textAlign: 'right', marginTop: '40px' }}>
          <p style={{ margin: '0', fontSize: '10px' }}>
            <strong>AGUS BUDI SANTOSA, S.Sos</strong><br/>
            NIP. 19721201 200701 1 013
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '10px' }}>
            <strong>EDY SANTOSA</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20mm', 
          right: '20mm', 
          fontSize: '10px',
          textAlign: 'right'
        }}>
          <p style={{ margin: '0' }}>LEMBAR</p>
          <p style={{ margin: '0' }}>Bukti Kas Nomor: {data.receiptNumber}</p>
          <p style={{ margin: '0' }}>Kode Rekening: {formatDate(data.date)}</p>
        </div>
      </div>
    </div>
  );
}

export default KwitansiPreview;
