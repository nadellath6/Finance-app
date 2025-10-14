import { useCallback } from 'react';
import { printElement, printHtml, printBySelector } from '../lib/print';

/**
 * usePrint - React hook wrapping print utilities with sensible defaults.
 * Defaults: A4 portrait, margin 0, includeGlobalStyles true.
 */
export function usePrint(defaults = {}) {
  const base = {
    page: 'A4',
    orientation: 'portrait',
    margin: '0',
    includeGlobalStyles: true,
    timeout: 200,
    ...defaults,
  };

  const printNode = useCallback((node, opts) => printElement(node, { ...base, ...opts }), [base]);
  const printHtmlString = useCallback((html, opts) => printHtml(html, { ...base, ...opts }), [base]);
  const printSelector = useCallback((sel, opts) => printBySelector(sel, { ...base, ...opts }), [base]);

  return { printNode, printHtml: printHtmlString, printSelector };
}

export default usePrint;

