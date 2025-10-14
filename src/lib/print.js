// Lightweight print utilities for React/Vite apps.
// Exports:
//   - printElement(element, options)
//   - printHtml(htmlString, options)
//   - printBySelector(selector, options)
// Options: title, page, orientation, margin, extraCss, includeGlobalStyles, onBeforePrint, onAfterPrint, timeout

function toCssSize(v) {
  if (v == null) return undefined;
  if (typeof v === 'number') return `${v}mm`;
  return String(v);
}

function resolveMargin(margin) {
  if (!margin) return '0';
  if (typeof margin === 'string' || typeof margin === 'number') return toCssSize(margin);
  const { top = 0, right = 0, bottom = 0, left = 0 } = margin || {};
  return `${toCssSize(top)} ${toCssSize(right)} ${toCssSize(bottom)} ${toCssSize(left)}`;
}

function buildPageStyle({ page = 'A4', orientation = 'portrait', margin } = {}) {
  const marginCss = resolveMargin(margin);
  // Body reset to avoid default margins and ensure background prints if allowed
  return `@page { size: ${page} ${orientation}; margin: ${marginCss}; }\n` +
         `html, body { background: #fff; margin: 0; padding: 0; }\n` +
         `body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`;
}

function createIframe() {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);
  return iframe;
}

function copyStyles(fromDoc, toDoc) {
  const head = toDoc.head;
  // Copy <link rel="stylesheet"> and <style>
  Array.from(fromDoc.querySelectorAll('link[rel="stylesheet"], style')).forEach((node) => {
    if (node.tagName.toLowerCase() === 'link') {
      const link = toDoc.createElement('link');
      link.rel = 'stylesheet';
      link.href = node.href;
      head.appendChild(link);
    } else {
      const style = toDoc.createElement('style');
      style.textContent = node.textContent || '';
      head.appendChild(style);
    }
  });
}

function waitForImages(doc) {
  const imgs = Array.from(doc.images || []);
  if (imgs.length === 0) return Promise.resolve();
  return Promise.allSettled(
    imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((res) => {
        img.addEventListener('load', () => res(), { once: true });
        img.addEventListener('error', () => res(), { once: true });
      });
    })
  ).then(() => void 0);
}

function writeDoc(iframe, { title, page, orientation, margin, extraCss, includeGlobalStyles = true, beforeWrite }) {
  const { contentDocument } = iframe;
  if (!contentDocument) throw new Error('Print iframe has no document');
  const doc = contentDocument;
  doc.open();
  doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
  doc.close();
  if (title) doc.title = title;

  if (includeGlobalStyles) copyStyles(document, doc);

  const style = doc.createElement('style');
  style.setAttribute('data-print-style', 'page');
  style.textContent = buildPageStyle({ page, orientation, margin });
  doc.head.appendChild(style);

  if (extraCss) {
    const extra = doc.createElement('style');
    extra.setAttribute('data-print-style', 'extra');
    extra.textContent = extraCss;
    doc.head.appendChild(extra);
  }

  if (typeof beforeWrite === 'function') beforeWrite(doc);
  return doc;
}

export async function printElement(element, options = {}) {
  if (!element) throw new Error('printElement: element is required');
  const iframe = createIframe();
  const doc = writeDoc(iframe, options);

  // Clone and append element content
  const wrapper = doc.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.boxSizing = 'border-box';
  wrapper.appendChild(element.cloneNode(true));
  doc.body.appendChild(wrapper);

  await waitForImages(doc);
  const { onBeforePrint, onAfterPrint, debugKeepIframe = false, timeout = 300 } = options;

  const win = iframe.contentWindow;
  if (!win) throw new Error('printElement: iframe has no contentWindow');

  if (typeof onBeforePrint === 'function') onBeforePrint(win);

  const cleanup = () => {
    if (!debugKeepIframe && iframe.parentNode) {
      try { iframe.parentNode.removeChild(iframe); } catch { /* ignore */ }
    }
    if (typeof onAfterPrint === 'function') onAfterPrint();
  };

  // Some browsers don't fire afterprint on iframes reliably; use both
  const afterHandler = () => cleanup();
  win.addEventListener('afterprint', afterHandler, { once: true });

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
    }
    // Fallback cleanup if afterprint doesn't fire
    setTimeout(() => cleanup(), 2000);
  }, timeout);
}

export async function printHtml(htmlString, options = {}) {
  if (!htmlString) throw new Error('printHtml: htmlString is required');
  const iframe = createIframe();
  const doc = writeDoc(iframe, options);
  const container = doc.createElement('div');
  container.innerHTML = htmlString;
  doc.body.appendChild(container);
  await waitForImages(doc);
  const { onBeforePrint, onAfterPrint, debugKeepIframe = false, timeout = 300 } = options;
  const win = iframe.contentWindow;
  if (!win) throw new Error('printHtml: iframe has no contentWindow');
  if (typeof onBeforePrint === 'function') onBeforePrint(win);

  const cleanup = () => {
    if (!debugKeepIframe && iframe.parentNode) {
      try { iframe.parentNode.removeChild(iframe); } catch { /* ignore */ }
    }
    if (typeof onAfterPrint === 'function') onAfterPrint();
  };
  win.addEventListener('afterprint', () => cleanup(), { once: true });
  setTimeout(() => {
    try { win.focus(); win.print(); } catch { cleanup(); }
    setTimeout(() => cleanup(), 2000);
  }, timeout);
}

export function printBySelector(selector, options = {}) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`printBySelector: element not found for selector: ${selector}`);
  return printElement(el, options);
}
