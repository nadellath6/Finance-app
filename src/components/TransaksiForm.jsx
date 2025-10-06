import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function TransaksiForm() {
  const [uraian, setUraian] = useState("");
  const [jumlah, setJumlah] = useState(0);
  const [harga, setHarga] = useState(0);

  const hitungTotal = () => {
    const subtotal = jumlah * harga;
    const pajak = subtotal * 0.11; // PPN 11%
    const total = subtotal + pajak;
    return { subtotal, pajak, total };
  };

  const simpanTransaksi = async (e) => {
    e.preventDefault();
    const { subtotal, pajak, total } = hitungTotal();
    
    try {
      await addDoc(collection(db, "transaksi"), {
        uraian,
        jumlah,
        harga,
        subtotal,
        pajak,
        total,
        tanggal: new Date()
      });
      alert("Transaksi berhasil disimpan!");
      setUraian("");
      setJumlah(0);
      setHarga(0);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const { subtotal, pajak, total } = hitungTotal();

  return (
    <div style={{ padding: "20px" }}>
      <h2>Input Transaksi</h2>
      <form onSubmit={simpanTransaksi}>
        <div>
          <label>Uraian:</label>
          <input
            type="text"
            value={uraian}
            onChange={(e) => setUraian(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Jumlah:</label>
          <input
            type="number"
            value={jumlah}
            onChange={(e) => setJumlah(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label>Harga Satuan:</label>
          <input
            type="number"
            value={harga}
            onChange={(e) => setHarga(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <h4>Perhitungan:</h4>
          <p>Subtotal: Rp {subtotal.toLocaleString()}</p>
          <p>Pajak (11%): Rp {pajak.toLocaleString()}</p>
          <p>Total: Rp {total.toLocaleString()}</p>
        </div>
        <button type="submit">Simpan Transaksi</button>
      </form>
    </div>
  );
}

export default TransaksiForm;
