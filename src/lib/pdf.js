// PDF utilities using html2pdf.js to generate and download PDFs directly
// Usage: downloadElementAsPdf(element, { filename, margin, orientation, scale })

import html2pdf from 'html2pdf.js';

export function downloadElementAsPdf(element, options = {}) {
  if (!element) throw new Error('downloadElementAsPdf: element is required');
  const {
    filename = 'kwitansi.pdf',
    margin = 0,
    orientation = 'portrait',
    scale = 2,
    page = 'a4',
  } = options;

  const opt = {
    margin,
    filename,
    pagebreak: { mode: ['css', 'legacy'] },
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: page, orientation },
  };

  return html2pdf().set(opt).from(element).save();
}

export default downloadElementAsPdf;
