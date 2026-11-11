// DOM stand-ins test shared behavior on every page, without network requests.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function element(){const classes=new Set();return {attrs:{},events:{},hidden:false,focused:false,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(k,fn){this.events[k]=fn;},focus(){this.focused=true;}};}
const source=fs.readFileSync('js/script.js','utf8');
const code=source.slice(0,source.indexOf('   2. PROJECT DATA')).replace(/\/\* ==========================================\s*$/,'');
const pages=['index','projects','background','contact'];
for(const page of pages){
    const toggle=element(),links=element(),navbar=element(),header=element(),settings=element(),panel=element(),container=element(),setting=element(),target=element(),year=element();
    panel.hidden=true;settings.hidden=true;target.attrs.tabindex='-1';
    const nav=['index','projects','background','contact'].map(file=>{const a=element();a.attrs.href=file+'.html';if(file===page)a.attrs['aria-current']='page';return a;});
    const skip=element();skip.attrs.href='#main-content';
    navbar.contains=node=>[toggle,links,settings,panel,container,setting,...nav].includes(node);
    container.contains=node=>[settings,panel,container,setting].includes(node);
    header.getBoundingClientRect=()=>({height:80});
    const docEvents={},winEvents={},cssVars={};let observed;
    const context={document:{documentElement:{style:{setProperty(k,v){cssVars[k]=v;}}},querySelector:s=>({'.menu-toggle':toggle,'.nav-links':links,'.navbar':navbar,'.site-header':header,'#settings-toggle':settings,'#settings-panel':panel,'.settings-container':container,'#current-year':year})[s]??null,querySelectorAll:s=>s==='.nav-links a'?nav:[skip],getElementById:id=>id==='main-content'?target:null,addEventListener(k,fn){docEvents[k]=fn;}},window:{innerWidth:375,addEventListener(k,fn){winEvents[k]=fn;}},ResizeObserver:class{observe(node){observed=node;}},URL,Date};
    vm.createContext(context);vm.runInContext(code,context);
    assert(navbar.classList.contains('navigation-ready'));assert(header.classList.contains('sticky-ready'));assert(!settings.hidden);
    assert.equal(cssVars['--header-height'],'80px');assert.equal(observed,header);
    toggle.events.click();assert.equal(toggle.attrs['aria-expanded'],'true');assert(nav[0].focused);
    docEvents.keydown({key:'Escape'});assert(toggle.focused);assert(!links.classList.contains('active'));
    for(const link of nav){toggle.events.click();link.events.click();assert(!links.classList.contains('active'));}
    toggle.events.click();docEvents.click({target:{}});assert(!links.classList.contains('active'));
    toggle.events.click();navbar.events.focusout({relatedTarget:nav[0]});assert(links.classList.contains('active'));
    navbar.events.focusout({relatedTarget:{}});assert(!links.classList.contains('active'));
    toggle.events.click();context.window.innerWidth=1200;winEvents.resize();assert(!links.classList.contains('active'));
    settings.events.click();assert(!panel.hidden);assert.equal(settings.attrs['aria-expanded'],'true');
    navbar.events.focusout({relatedTarget:setting});assert(!panel.hidden);docEvents.click({target:setting});assert(!panel.hidden);
    docEvents.keydown({key:'Escape'});assert(panel.hidden);assert(settings.focused);
    settings.events.click();docEvents.click({target:{}});assert(panel.hidden);
    settings.events.click();navbar.events.focusout({relatedTarget:nav[0]});assert(panel.hidden);
    toggle.events.click();settings.events.click();assert(!links.classList.contains('active'));assert(!panel.hidden);
    toggle.events.click();assert(panel.hidden);skip.events.click();assert(target.focused);assert(!links.classList.contains('active'));
    winEvents.load();assert.equal(cssVars['--header-height'],'80px');
    assert.equal(nav.find(a=>a.attrs.href===page+'.html').attrs['aria-current'],'page');
    const html=fs.readFileSync(page+'.html','utf8');
    assert.match(html,/id="settings-toggle"[^>]*type="button"[^>]*aria-expanded="false"[^>]*aria-controls="settings-panel"/);
    assert.match(html,/id="settings-panel"[^>]*aria-label="Display settings" hidden/);
    assert.equal((html.match(/id="theme-choice"/g)||[]).length,1);
    assert(!html.includes('display-size'));assert(!html.includes('about.html'));
    assert.match(html,/class="skip-link" href="#main-content"/);
    // The full shared script must also initialize safely without project/form elements.
    if(!['projects','contact'].includes(page)){
        const fullContext={...context};vm.createContext(fullContext);vm.runInContext(source,fullContext);
        assert.equal(String(year.textContent),String(new Date().getFullYear()));
    }
}
console.log('Passed: all-page menu/Settings initialization, page-link closure, Escape/outside/focus handling, first-link focus, mutually exclusive panels, resize/header offset, skip-link focus, static active-page states, year, and safe optional initialization.');

const css=fs.readFileSync('css/style.css','utf8');
assert.match(css,/grid-template-columns: minmax\(0, 1fr\) max-content minmax\(0, 1fr\);/);
assert.match(css,/\.logo\s*\{\s*justify-self: start;/);
assert.match(css,/\.header-actions\s*\{[^}]*flex-wrap: nowrap;[^}]*justify-self: end;/);
assert.match(css,/\.navbar\s*\{\s*grid-template-columns: minmax\(0, 1fr\) auto;/);
assert.match(css,/\.nav-links \.mobile-contact > a\s*\{[^}]*background-color: var\(--button-bg\);[^}]*color: var\(--button-text\);/);
for(const page of pages) {
    const html=fs.readFileSync(page+'.html','utf8');
    assert.match(html,/<li class="mobile-contact"><a href="contact.html"(?: aria-current="page")? data-i18n="nav.contact">Contact Me<\/a><\/li>/);
}
console.log('Passed: full-width centered desktop links using equal outer grid tracks, left/right zone alignment, nonwrapping desktop actions, and a single visible mobile Contact Me action.');

// Navbar uses the viewport width; the body keeps its existing readable content cap.
const desktopNavbar=css.match(/\.navbar\s*\{([^}]+)\}/)[1];
assert.match(desktopNavbar,/width: 100%;/);
assert.match(desktopNavbar,/max-width: none;/);
assert.match(desktopNavbar,/padding: 0\.75rem clamp\(1\.25rem, 3vw, 3rem\);/);
assert(!desktopNavbar.includes('var(--content-width)'));
assert.match(css,/main\s*\{[^}]*max-width: var\(--content-width\);/);
assert.match(css,/\.site-header\.sticky-ready\s*\{[^}]*position: sticky;[^}]*top: 0;/);
console.log('Passed: viewport-wide navbar, symmetric fluid 20–48px default padding, preserved vertical padding/sticky positioning, and separate body width cap.');
