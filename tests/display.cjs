// Source checks for automatic sizing; this does not replace rendered browser tests.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('css/style.css','utf8');
assert(!/display-size|js\/display\.js/.test(html));
assert(!fs.existsSync('js/display.js'));
assert(!/data-display-size|--type-scale|--space-scale/.test(css));
assert.match(css,/font-size:\s*100%;/);
assert.match(css,/--page-gutter:\s*clamp\(/);
assert.match(css,/--section-gap:\s*clamp\(/);
assert.match(css,/--card-padding:\s*clamp\(/);
assert.match(css,/--content-width:\s*100rem;/);
for(const width of [380,600,700,900,1000])assert(css.includes(`@media (max-width: ${width}px)`));
const projectGrid=css.match(/\.projects-grid\s*\{([^}]+)\}/)[1];
assert.match(projectGrid,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css,/@media \(max-width: 600px\)[\s\S]*?\.projects-grid\s*\{\s*grid-template-columns: 1fr;/);
assert.match(css,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css,/min-height:\s*44px;/);
assert.match(css,/select:focus-visible/);
assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
assert(!/text-size-adjust\s*:\s*none|zoom\s*:|overflow-x\s*:\s*hidden/.test(css));
assert(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(html));
assert(!/font-size:\s*[^;]*\dpx/.test(css));
assert(!/hero-glow|linear-gradient|radial-gradient/.test(css));
// All hardcoded theme colors belong to the token definitions, not component rules.
const components=css.slice(css.indexOf('   2. RESET'));
assert(!/#[a-f\d]{3,8}\b|rgba?\(/i.test(components));
const declared=new Set(Array.from(css.matchAll(/(--[\w-]+)\s*:/g),m=>m[1]));
for(const match of css.matchAll(/var\((--[\w-]+)/g))assert(declared.has(match[1]),`Undefined token ${match[1]}`);
// Catch unbalanced braces outside comments/strings; not a full CSS validator.
let depth=0;
for(const char of css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"[^"]*"|'[^']*'/g,'')) {
    if(char==='{')depth++;if(char==='}')depth--;assert(depth>=0);
}
assert.equal(depth,0);
// Stale size preferences are ignored; the saved theme remains independently effective.
for(const theme of ['dark','light'])for(const oldSize of ['small','medium','large']) {
    const attrs={},store=new Map([['portfolio-theme',theme],['portfolio-display-size',oldSize]]);
    vm.runInNewContext(fs.readFileSync('js/theme.js','utf8'),{
        document:{documentElement:{setAttribute(k,v){attrs[k]=v;}},querySelector:()=>null,addEventListener(){}},
        window:{matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem(k){assert.equal(k,'portfolio-theme');return store.get(k);}},addEventListener(){}}
    });
    assert.equal(attrs['data-theme'],theme);assert(!('data-display-size' in attrs));
    assert.equal(store.get('portfolio-display-size'),oldSize);
}
console.log('Passed: automatic fluid sizing, responsive grid/header rules, relative typography, unobstructed browser zoom, removed size overrides, token references/CSS braces, legacy size preferences ignored.');

assert.match(css,/body\s*\{[^}]*display: flex;[^}]*flex-direction: column;[^}]*min-height: 100dvh;/);
assert.match(css,/main\s*\{[^}]*flex: 1 0 auto;[^}]*width: calc\(100% - 2 \* var\(--page-gutter\)\);/);
assert.match(css,/main > section:last-child\s*\{\s*margin-bottom: 0;/);
assert.match(css,/grid-template-columns: minmax\(0, 1\.1fr\) minmax\(0, 0\.9fr\);/);
assert.match(css,/\.code-card\s*\{[^}]*max-width: 40rem;/);
assert.match(css,/\.contact-section\s*\{[^}]*max-width: 42\.5rem;[^}]*margin-inline: auto;/);
const footerStyles=css.match(/\.site-footer\s*\{([^}]+)\}/)[1];
assert.match(footerStyles,/flex-shrink: 0;/);
assert.match(footerStyles,/padding: 1\.25rem 1rem;/);
assert.match(footerStyles,/border-top: 1px solid var\(--border-color\);/);
assert.match(footerStyles,/background-color: var\(--bg-secondary\);/);
assert.match(footerStyles,/color: var\(--text-secondary\);/);
assert.match(footerStyles,/text-align: center;/);
assert(!/footer-container|footer-info|footer-return|footer-bottom|back-to-top/.test(css));
console.log('Passed: flexible viewport-height shell, readable content widths, and a centered theme-aware copyright footer with a subtle top border.');

assert.match(css,/\.contact-container\s*\{[^}]*width: 100%;[^}]*max-width: 100%;/);
console.log('Passed: contact heading and form retain a shared column under default-font resizing.');

assert.match(css,/--page-gutter: clamp\(1rem, 5vw, 6rem\);/);
assert.match(css,/\.about-content p\s*\{[^}]*max-width: 70ch;/);
assert.match(css,/\.code-block\s*\{[^}]*white-space: pre-wrap;[^}]*overflow-wrap: anywhere;/);
assert(!/projects-container|Featured Projects|class="project-card"/.test(html));
const snippet=html.match(/<pre class="code-block"><code>([\s\S]*?)<\/code><\/pre>/)[1].replace(/<[^>]+>/g,'');
assert.equal(snippet,'// Building the future\nconst developer = {\n  passion: "coding",\n  focus: "learning",\n  mindset: "growth"\n};');
for(const token of ['keyword','string','variable','property','comment'])assert(html.includes('class="syntax-'+token+'"'));
console.log('Passed: readable biography text, wrapping semantic code, original snippet, and Home without any project gallery.');

assert.match(css,/--home-content-width: 82\.5rem;/);
assert.match(css,/--home-gutter: clamp\(1\.25rem, 3vw, 2rem\);/);
assert.match(css,/\.home-page\s*\{[^}]*width: 100%;[^}]*max-width: var\(--home-content-width\);[^}]*padding-inline: var\(--home-gutter\);/);
assert.match(css,/\.home-page \.hero\s*\{\s*gap: clamp\(1\.5rem, 4vw, 4rem\);/);
assert.match(css,/\.home-page \.hero-visual\s*\{\s*justify-content: center;/);
assert.match(css,/\.home-page \.code-card\s*\{\s*max-width: 36rem;/);
assert.match(css,/\.home-page \.about-section\s*\{\s*max-width: 50rem;/);
assert.match(css,/\.home-page \.about-content\s*\{[^}]*display: block;[^}]*max-width: 70ch;/);
assert.match(css,/\.home-page \.closing-cta\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/);
assert.match(css,/@media \(max-width: 600px\)\s*\{\s*\.home-page \.closing-cta\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);
const biography=html.match(/<div class="about-content">([\s\S]*?)<\/div>/)[1];
assert.equal((biography.match(/<p\b[^>]*>/g)||[]).length,3);
assert(!/background-preview|Learning &amp; Building|Always Learning/.test(html));
assert(!css.includes('background-preview'));
assert.match(html,/class="background-text-link" href="background.html"><span data-i18n="home.explore">Explore My Background/);
console.log('Passed: centered 1320px Home cap, fluid gutters, connected 55/45 hero, bounded editor, continuous biography, removed preview card, subtle Background link, and stacked mobile CTA.');

// Certifications have their own layout; the shared Education grid stays at two columns.
assert.match(css,/\.learning-grid\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*grid-auto-rows: 1fr;/);
assert.match(css,/\.learning-section \.learning-grid\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
assert.match(css,/@media \(max-width: 1000px\)\s*\{\s*\.learning-section \.learning-grid\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
assert.match(css,/@media \(max-width: 600px\)\s*\{\s*\.learning-section \.learning-grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);
assert.match(css,/\.learning-section \.learning-card\s*\{[^}]*gap: 0\.5rem;[^}]*padding: 1rem;/);
assert.match(css,/\.learning-section \.learning-card h3\s*\{[^}]*font-size: 1rem;/);
assert.match(css,/\.learning-certificate\s*\{[^}]*margin-top: auto;/);
assert.match(css,/\.certificate-link\s*\{[^}]*min-height: 44px;[^}]*color: var\(--accent\);/);
assert.match(css,/\.certificate-link:focus-visible\s*\{[^}]*outline: 3px solid var\(--accent\);/);
console.log('Passed: compact equal-height certificate grid with three/two/one columns, preserved Education grid, aligned links, theme tokens, and keyboard focus.');
