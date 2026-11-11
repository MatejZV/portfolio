const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('js/theme.js', 'utf8');
function setup({saved = null, dark = false, storageFails = false} = {}) {
    const attrs = {}, docEvents = {}, winEvents = {}, selectEvents = {};
    const root = {setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];}};
    const select = {value:'',addEventListener(k,fn){selectEvents[k]=fn;}};
    const control = {hidden:true};
    const media = {matches:dark,addEventListener(k,fn){this.change=fn;}};
    const meta = {setAttribute(k,v){this[k]=v;}};
    const store = new Map(saved === null ? [] : [['portfolio-theme',saved]]);
    vm.runInNewContext(source, {
        document:{documentElement:root,querySelector:s=>s==='#theme-choice'?select:s==='.theme-control'?control:meta,addEventListener(k,fn){docEvents[k]=fn;}},
        window:{matchMedia(query){assert.equal(query,'(prefers-color-scheme: dark)');return media;},localStorage:{getItem(k){if(storageFails)throw Error('blocked');return store.get(k)??null;},setItem(k,v){if(storageFails)throw Error('blocked');store.set(k,v);}},addEventListener(k,fn){winEvents[k]=fn;}}
    });
    return {attrs,select,control,meta,store,media,winEvents,mount:()=>docEvents.DOMContentLoaded(),choose(value){select.value=value;selectEvents.change();}};
}
for (const dark of [true,false]) {
    const s=setup({dark});
    assert.equal(s.attrs['data-theme'],dark?'dark':'light');assert(s.control.hidden);
    assert.equal(s.store.size,0);s.mount();assert.equal(s.control.hidden,false);
    assert.equal(s.select.value,'system');
    s.media.matches=!dark;s.media.change();assert.equal(s.attrs['data-theme'],dark?'light':'dark');assert.equal(s.select.value,'system');
}
for (const saved of ['dark','light']) {
    const s=setup({saved,dark:saved==='light'});s.mount();
    assert.equal(s.attrs['data-theme'],saved);s.media.change();assert.equal(s.attrs['data-theme'],saved);
    const selected=saved==='dark'?'light':'dark';s.choose(selected);
    assert.equal(s.attrs['data-theme'],selected);assert.equal(s.store.get('portfolio-theme'),selected);assert.equal(s.select.value,selected);
    assert.equal(s.meta.content,selected==='dark'?'#211D1B':'#FAF6F0');
    const reload=setup({saved:s.store.get('portfolio-theme')});assert.equal(reload.attrs['data-theme'],selected);
    s.choose('invalid');assert.equal(s.attrs['data-theme'],selected);assert.equal(s.select.value,selected);
    s.store.set('portfolio-theme',saved);s.winEvents.storage({key:'portfolio-theme'});assert.equal(s.attrs['data-theme'],saved);assert.equal(s.select.value,saved);
    s.store.clear();s.winEvents.storage({key:null});assert.equal(s.attrs['data-theme'],s.media.matches?'dark':'light');
}
const explicit=setup({dark:true});explicit.mount();explicit.choose('light');explicit.media.matches=true;explicit.media.change();assert.equal(explicit.attrs['data-theme'],'light');
const invalid=setup({saved:'invalid',dark:true});assert.equal(invalid.attrs['data-theme'],'dark');
const blocked=setup({storageFails:true,dark:false});blocked.mount();blocked.choose('dark');assert.equal(blocked.attrs['data-theme'],'dark');
blocked.media.matches=false;blocked.media.change();assert.equal(blocked.attrs['data-theme'],'dark');
// Returning to System must preserve the mode rather than its current resolved color.
for (const dark of [true,false]) {
    const s=setup({saved:dark?'light':'dark',dark});s.mount();s.choose('system');
    assert.equal(s.select.value,'system');assert.equal(s.store.get('portfolio-theme'),'system');
    assert.equal(s.attrs['data-theme'],dark?'dark':'light');
    s.media.matches=!dark;s.media.change();
    assert.equal(s.attrs['data-theme'],dark?'light':'dark');assert.equal(s.select.value,'system');
    const reload=setup({saved:s.store.get('portfolio-theme'),dark});reload.mount();
    assert.equal(reload.select.value,'system');assert.equal(reload.attrs['data-theme'],dark?'dark':'light');
    s.store.set('portfolio-theme','dark');s.winEvents.storage({key:'portfolio-theme'});
    s.store.set('portfolio-theme','system');s.winEvents.storage({key:'portfolio-theme'});
    assert.equal(s.select.value,'system');assert.equal(s.attrs['data-theme'],s.media.matches?'dark':'light');
}
blocked.choose('system');assert.equal(blocked.select.value,'system');
blocked.media.matches=true;blocked.media.change();assert.equal(blocked.attrs['data-theme'],'dark');
console.log('Passed: explicit System mode, live system changes, persistence/reload, cross-tab return to System, and blocked storage.');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/<label class="theme-control" for="theme-choice" hidden>/);
assert.match(html,/<select id="theme-choice" name="theme-choice" aria-label="Theme" data-i18n-aria-label="settings.theme">/);
assert.match(html,/<option value="dark" data-i18n="settings.dark">Dark<\/option>/);assert.match(html,/<option value="light" data-i18n="settings.light">Light<\/option>/);
assert.equal((html.match(/id="theme-choice"/g)||[]).length,1);
assert(!/theme-toggle|theme-icon-sun|theme-icon-moon/.test(html));
assert(html.indexOf('<script src="js/theme.js"></script>')<html.indexOf('<link rel="stylesheet"'));
const css=fs.readFileSync('css/style.css','utf8');
assert.match(css,/:root\[data-theme="light"\]/);assert.match(css,/@media \(prefers-color-scheme: light\)/);
assert.match(css,/select:focus-visible/);assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
console.log('Passed: early saved/system selection, following system until explicit choice, native Theme options, persistence/reload, cross-tab updates, invalid/blocked storage, accessible labels, no duplicate theme controls.');
// Check actual theme variables for readable text and visible control/focus colors.
function variables(block) {
    return Object.fromEntries(Array.from(block.matchAll(/(--[\w-]+):\s*(#[a-f\d]{6})\s*;/gi),m=>[m[1],m[2]]));
}
const darkPalette=variables(css.match(/:root\s*\{([^}]+)\}/)[1]);
const lightPalette={...darkPalette,...variables(css.match(/:root\[data-theme="light"\]\s*\{([^}]+)\}/)[1])};
function luminance(hex) {
    const channels=hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
    return channels.reduce((sum,c,i)=>sum+c*[0.2126,0.7152,0.0722][i],0);
}
function contrast(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
for(const [theme,p] of [['dark',darkPalette],['light',lightPalette]]) {
    const textPairs=[['--code-accent','--bg-card'],['--success-text','--success-bg'],['--button-text','--button-bg'],['--button-text','--button-hover'],['--tag-text','--tag-bg'],['--progress-text','--progress-bg'],['--planned-text','--planned-bg'],['--badge-text','--bg-secondary']];
    for(const background of ['--bg-primary','--bg-secondary','--bg-card']) {
        for(const foreground of ['--text-primary','--text-secondary','--accent','--error-text','--success-text'])textPairs.push([foreground,background]);
    }
    for(const token of ['keyword','string','variable','property','comment','default'])textPairs.push(['--syntax-'+token,'--bg-card']);
    for(const [fg,bg] of textPairs)assert(contrast(p[fg],p[bg])>=4.5,`${theme}: ${fg} on ${bg}`);
    assert(contrast(p['--input-border'],p['--bg-secondary'])>=3);
    assert(contrast(p['--accent'],p['--bg-card'])>=3);
    assert(contrast(p['--error-border'],p['--bg-secondary'])>=3);
    console.log(`${theme}: button ${contrast(p['--button-text'],p['--button-bg']).toFixed(2)}:1; secondary text ${contrast(p['--text-secondary'],p['--bg-card']).toFixed(2)}:1; focus ${contrast(p['--accent'],p['--bg-card']).toFixed(2)}:1`);
}
console.log('Passed: dark/light text, buttons, badges, feedback, focus, input boundaries, and all six editor syntax colors meet contrast thresholds.');
for(const page of ['index','projects','background','contact']) {
    const html=fs.readFileSync(page+'.html','utf8');
    assert(html.indexOf('<script src="js/theme.js"></script>')<html.indexOf('<link rel="stylesheet"'));
    assert.match(html,/<select id="theme-choice" name="theme-choice" aria-label="Theme" data-i18n-aria-label="settings.theme">/);
    assert.equal((html.match(/id="theme-choice"/g)||[]).length,1);
    assert.match(html,/<option value="system" data-i18n="settings.system">System<\/option>/);
    for(const theme of ['dark','light']) {
        const s=setup({saved:theme,dark:theme==='light'});s.mount();assert.equal(s.select.value,theme);
        const other=theme==='dark'?'light':'dark';s.choose(other);
        const nextPage=setup({saved:s.store.get('portfolio-theme')});assert.equal(nextPage.attrs['data-theme'],other);
    }
}
console.log('Passed: identical early theme loading, accessible selector, switching, and cross-page saved-theme behavior across all four pages.');
