// Convert number to Indonesian words (terbilang) without currency
// Supports up to 15 digits (quadrillion range)
// Example: 56622221 -> "Lima Puluh Enam Juta Enam Ratus Dua Puluh Dua Ribu Dua Ratus Dua Puluh Satu"

function chunkToWords(n) {
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];

  let out = [];
  const ratus = Math.floor(n / 100);
  const puluhBelas = n % 100;
  const puluh = Math.floor(puluhBelas / 10);
  const satu = puluhBelas % 10;

  // Hundreds
  if (ratus > 0) {
    if (ratus === 1) out.push("Seratus"); else out.push(satuan[ratus] + " Ratus");
  }

  // Tens and teens
  if (puluhBelas > 0) {
    if (puluhBelas < 10) {
      out.push(satuan[satu]);
    } else if (puluhBelas === 10) {
      out.push("Sepuluh");
    } else if (puluhBelas === 11) {
      out.push("Sebelas");
    } else if (puluhBelas < 20) {
      out.push(satuan[satu] + " Belas");
    } else {
      out.push(satuan[puluh] + " Puluh");
      if (satu > 0) out.push(satuan[satu]);
    }
  }

  return out.join(" ").trim();
}

export default function terbilang(num) {
  // Accept string/number, sanitize to integer >= 0
  if (num === null || num === undefined || num === "") return "";
  let n = Number(String(num).replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "Nol";

  const units = ["", "Ribu", "Juta", "Miliar", "Triliun", "Kuadriliun"]; // up to 10^15
  let words = [];
  let unitIndex = 0;

  while (n > 0 && unitIndex < units.length) {
    const chunk = n % 1000;
    if (chunk > 0) {
      let part = chunkToWords(chunk);
      // Special case for 1000-1999 -> Seribu (not Satu Ribu)
      if (unitIndex === 1 && chunk === 1) {
        part = "Seribu";
      } else if (units[unitIndex]) {
        part = part + (part ? " " : "") + units[unitIndex];
      }
      words.unshift(part);
    }
    n = Math.floor(n / 1000);
    unitIndex++;
  }

  return words.join(" ").replace(/\s+/g, " ").trim();
}
