/**
 * Print a single element without the surrounding app chrome.
 *
 * Renders a copy of the element into a hidden iframe that carries the page's
 * stylesheets (Tailwind), then prints just that document.
 */
export function printElement(el: HTMLElement, title: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) { iframe.remove(); return; }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => (node instanceof HTMLLinkElement ? `<link rel="stylesheet" href="${node.href}">` : node.outerHTML))
    .join('\n');

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}
    <style>@page { margin: 12mm; } body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }</style>
    </head><body>${el.outerHTML}</body></html>`);
  doc.close();

  // Give stylesheets and fonts a moment to apply before printing.
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 400);
}
