const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('background.html', 'utf8');
const source = fs.readFileSync('js/certificates.js', 'utf8');
const names = ['codecademy-learn-csharp', 'codecademy-learn-javascript', 'udemy-csharp-intermediate'];
const anchors = [...html.matchAll(/<a\b[^>]*data-certificate-preview[^>]*>/g)].map(m => m[0]);
assert.equal(anchors.length, 3);
for (const [i, name] of names.entries()) {
    assert(anchors[i].includes(`href="assets/certificates/${name}.webp"`));
    assert(anchors[i].includes(`data-certificate-pdf="assets/certificates/${name}.pdf"`));
    const preview = fs.readFileSync(`assets/certificates/${name}.webp`);
    assert.equal(preview.toString('ascii', 0, 4), 'RIFF');
    assert.equal(preview.toString('ascii', 8, 12), 'WEBP');
    assert.equal(fs.readFileSync(`assets/certificates/${name}.pdf`).toString('ascii', 0, 5), '%PDF-');
}
assert.match(html, /<dialog[^>]*id="certificate-dialog"[^>]*aria-labelledby="certificate-dialog-title"[^>]*aria-describedby="certificate-course"/);
assert.match(html, /id="certificate-close" autofocus/);
assert.match(html, /id="certificate-viewport"[^>]*tabindex="0"[^>]*role="region"/);
assert.match(html, /id="certificate-pdf" target="_blank" rel="noopener noreferrer"/);
assert.match(html, /<script src="js\/certificates.js" defer><\/script>/);

function element() {
    return {
        events: {}, attrs: {}, hidden: false, dataset: {}, style: {},
        classList: { remove() {}, toggle(name, value) { this[name] = value; } },
        addEventListener(type, fn) { this.events[type] = fn; },
        setAttribute(k, v) { this.attrs[k] = v; },
        getAttribute(k) { return this.attrs[k] ?? null; },
        removeAttribute(k) { delete this[k]; },
        focus() { this.focused = true; }
    };
}
const dialog = element(), image = element(), title = element(), pdf = element();
const close = element(), zoom = element(), viewport = element(), error = element();
const controls = {img: image, '#certificate-course': title, '#certificate-pdf': pdf,
    '#certificate-close': close, '#certificate-zoom': zoom,
    '.certificate-viewport': viewport, '#certificate-error': error};
dialog.id = 'certificate-dialog';
dialog.querySelector = selector => controls[selector];
dialog.showModal = () => { dialog.open = true; };
dialog.close = () => { dialog.open = false; dialog.events.close(); };
const links = names.map((name, i) => Object.assign(element(), {
    href: `https://example.com/portfolio/assets/certificates/${name}.webp`,
    dataset: {certificatePdf: `assets/certificates/${name}.pdf`, certificateHeading: `course-${i}`}
}));
const document = {
    body: {style: {overflow: 'auto'}},
    querySelector: () => dialog,
    querySelectorAll: () => links,
    getElementById: id => ({title: '', textContent: id})
};
vm.runInNewContext(source, {document});
assert.equal(image.src, undefined, 'Preview must not load before opening');
for (const link of links) {
    assert.equal(link.attrs['aria-haspopup'], 'dialog');
    let prevented = false;
    const event = {button: 0, preventDefault() { prevented = true; }};
    link.events.click({...event, ctrlKey: true});assert(!prevented);
    link.events.click(event);
    assert(prevented);assert(dialog.open);assert(close.focused);
    let trapped = false;
    document.activeElement = close;
    dialog.events.keydown({key: 'Tab', shiftKey: true, preventDefault() { trapped = true; }});
    assert(trapped);assert(viewport.focused);
    document.activeElement = viewport;trapped = false;
    dialog.events.keydown({key: 'Tab', shiftKey: false, preventDefault() { trapped = true; }});
    assert(trapped);assert(close.focused);
    assert.equal(document.body.style.overflow, 'hidden');
    assert.equal(image.src, link.href);assert.equal(image.alt, link.dataset.certificateHeading);
    assert.equal(pdf.href, link.dataset.certificatePdf);
    zoom.events.click();assert.equal(zoom.attrs['aria-pressed'], 'true');
    assert(viewport.classList['is-zoomed']);
    zoom.events.click();assert.equal(zoom.attrs['aria-pressed'], 'false');
    dialog.events.click({target: image});assert(dialog.open);
    image.events.error();assert(image.hidden);assert(!error.hidden);
    dialog.events.click({target: dialog});assert(!dialog.open);assert(link.focused);
    assert.equal(document.body.style.overflow, 'auto');assert.equal(image.src, undefined);
    link.events.click(event);assert(!image.hidden);assert(error.hidden);
    close.events.click();assert(!dialog.open);
}
vm.runInNewContext(source, {document: {querySelector: () => null}});
vm.runInNewContext(source, {document: {querySelector: () => ({})}});
console.log('Passed: three relative image/PDF pairs, WebP assets, dialog labels, keyboard-scroll region, lazy opening, modified clicks, focus restoration, close/backdrop, zoom, load-error fallback, and progressive enhancement.');
console.log('Native Escape, focus containment, and responsive image layout require browser verification.');
