const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('background.html', 'utf8');
const source = fs.readFileSync('js/certificates.js', 'utf8');
const names = ['codecademy-learn-csharp', 'codecademy-learn-javascript'];
const anchors = [...html.matchAll(/<a\b[^>]*data-certificate-preview[^>]*>/g)].map(m => m[0]);
assert.equal(anchors.length, 2);
assert.deepEqual(fs.readdirSync('assets/certificates').sort(), names.flatMap(name => [`${name}.pdf`, `${name}.webp`]).sort());
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
assert(!/id="certificate-(?:pdf|zoom)"/.test(html));
assert(html.indexOf('id="certificate-image"') < html.indexOf('class="certificate-topics"'));
const expectedTopics = [
    ['types','numbers','strings','logic','collections','loops','methods','classes','encapsulation'],
    ['conditionals','functions','scope','arrays','iterators','objects']
];
const dialogMarkup = html.slice(html.indexOf('<dialog'));
const lists = [...dialogMarkup.matchAll(/<ul class="certificate-topic-list"[^>]*>([\s\S]*?)<\/ul>/g)];
assert.equal(lists.length, 2);
for (let i=0;i<2;i++) assert.deepEqual([...lists[i][1].matchAll(/data-i18n="certificate.topics.([^"]+)"/g)].map(m=>m[1]), expectedTopics[i]);
const courseCard = html.match(/<article class="learning-card" aria-labelledby="intermediate-course-heading">([\s\S]*?)<\/article>/)[1];
assert.match(courseCard, /Learn Intermediate C#/);
assert.match(courseCard, /data-i18n="status.progress">In Progress/);
assert.match(courseCard, /data-i18n="course.progress">Progress snapshot: 40%/);
assert.match(courseCard, /Manually recorded; not automatically updated\./);
assert.match(courseCard, /href="https:\/\/www.codecademy.com\/enrolled\/courses\/learn-intermediate-c-sharp"/);
assert(!/data-certificate-preview|<img|status.completed/.test(courseCard));
const disclosure = courseCard.match(/<details class="course-details">([\s\S]*?)<\/details>/)[1];
assert.match(disclosure, /<summary data-i18n="course.topicsCompleted">Topics completed so far<\/summary>/);
assert.deepEqual([...disclosure.matchAll(/<li data-i18n="course.([^"]+)"/g)].map(m=>m[1]),
    ['inheritance','polymorphism','interfaces','references','objectClass','stringsExceptions','enumerations']);
const dictionaries = {window:{}};
vm.runInNewContext(fs.readFileSync('js/translations.js','utf8'), dictionaries);
for (const lang of ['en','sl','de']) {
    assert.match(dictionaries.window.portfolioTranslations[lang]['course.progress'], /40\s*%/);
    for (const key of ['snapshot','topicsCompleted','inheritance','polymorphism','interfaces','references','objectClass','stringsExceptions','enumerations','view']) {
        assert(dictionaries.window.portfolioTranslations[lang][`course.${key}`]);
    }
}

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
const dialog = element(), image = element(), title = element();
const close = element(), viewport = element(), error = element();
const controls = {img: image, '#certificate-course': title,
    '#certificate-close': close,
    '.certificate-viewport': viewport, '#certificate-error': error};
const headingIds = ['csharp-course-heading','javascript-course-heading'];
const topics = headingIds.map(id => ({hidden: true, dataset: {certificateTopics: id}}));
dialog.querySelectorAll = () => topics;
dialog.id = 'certificate-dialog';
dialog.querySelector = selector => controls[selector];
dialog.showModal = () => { dialog.open = true; };
dialog.close = () => { dialog.open = false; dialog.events.close(); };
const links = names.map((name, i) => Object.assign(element(), {
    href: `https://example.com/portfolio/assets/certificates/${name}.webp`,
    dataset: {certificatePdf: `assets/certificates/${name}.pdf`, certificateHeading: headingIds[i]}
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
    assert.equal(topics.filter(panel=>!panel.hidden).length,1);
    assert.equal(topics.find(panel=>!panel.hidden).dataset.certificateTopics,link.dataset.certificateHeading);
    dialog.events.click({target: image});assert(dialog.open);
    image.events.error();assert(image.hidden);assert(!error.hidden);
    dialog.events.click({target: dialog});assert(!dialog.open);assert(link.focused);
    assert.equal(document.body.style.overflow, 'auto');assert.equal(image.src, undefined);
    link.events.click(event);assert(!image.hidden);assert(error.hidden);
    close.events.click();assert(!dialog.open);
}
vm.runInNewContext(source, {document: {querySelector: () => null}});
vm.runInNewContext(source, {document: {querySelector: () => ({})}});
console.log('Passed: two relative image/PDF pairs, WebP assets, dialog labels, keyboard-scroll region, lazy opening, modified clicks, focus restoration, close/backdrop, course-specific verified topics, load-error fallback, and progressive enhancement.');
console.log('Native Escape, focus containment, and responsive image layout require browser verification.');
console.log('Passed: in-progress course, manual 40% snapshot, native disclosure, exact seven completed topics, course link, translations, and no certificate/completion claim.');
