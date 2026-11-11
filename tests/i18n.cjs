// Integration tests with a small DOM: real page markup, dictionaries and application scripts.
// This exercises identity/state preservation, but does not replace browser layout testing.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const decode = s => s.replace(/&amp;/g,'&').replace(/&copy;/g,'©').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
class Element {
    constructor(tag, attrs = {}) {
        this.tag = tag; this.attrs = attrs; this.children = []; this.events = {};
        this.style = {setProperty(){}}; this.value = ''; this.readOnly = false; this.disabled = false;
        this.classList = {
            contains: c => this.className.split(/\s+/).includes(c),
            add: c => { if (!this.classList.contains(c)) this.className += ` ${c}`; },
            remove: (...cs) => { this.className = this.className.split(/\s+/).filter(c => !cs.includes(c)).join(' '); }
        };
    }
    get className(){return this.attrs.class || '';}
    set className(v){this.attrs.class = v;}
    get hidden(){return 'hidden' in this.attrs;}
    set hidden(v){if(v)this.attrs.hidden='';else delete this.attrs.hidden;}
    get lang(){return this.attrs.lang;}
    set lang(v){this.attrs.lang=v;}
    get action(){return this.attrs.action;}
    get textContent(){return this.children.map(c => typeof c === 'string' ? c : c.textContent).join('');}
    set textContent(v){this.children = [String(v)];}
    get childElementCount(){return this.children.filter(c => c instanceof Element).length;}
    getAttribute(k){return this.attrs[k] ?? null;}
    setAttribute(k,v){this.attrs[k]=String(v);}
    removeAttribute(k){delete this.attrs[k];}
    append(...nodes){nodes.forEach(n => {if(n instanceof Element)n.parent=this;this.children.push(n);});}
    appendChild(n){this.append(n);return n;}
    replaceChildren(...nodes){this.children=[];this.append(...nodes);}
    remove(){this.parent.children=this.parent.children.filter(n => n!==this);}
    contains(node){return node===this || this.children.some(c => c instanceof Element && c.contains(node));}
    focus(){this.focused=true;}
    getBoundingClientRect(){return {height:80};}
    addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
    async fire(k,event={}){for(const fn of this.events[k]||[])await fn(event);}
    querySelectorAll(selector){
        const found=[];
        function simple(node,s){
            const tag=s.match(/^[\w-]+/);if(tag && node.tag!==tag[0])return false;
            const id=s.match(/#([\w-]+)/);if(id && node.attrs.id!==id[1])return false;
            for(const m of s.matchAll(/\.([\w-]+)/g))if(!node.classList.contains(m[1]))return false;
            for(const m of s.matchAll(/\[([\w-]+)(?:(\^?=)"([^"]*)")?\]/g)){
                const v=node.getAttribute(m[1]);if(v===null)return false;
                if(m[2]==='=' && v!==m[3])return false;
                if(m[2]==='^=' && !v.startsWith(m[3]))return false;
            }
            return true;
        }
        function matches(node,s){
            const parts=s.trim().split(/\s+/);if(!simple(node,parts.pop()))return false;
            let ancestor=node.parent;
            while(parts.length){const next=parts.pop();while(ancestor && !simple(ancestor,next))ancestor=ancestor.parent;if(!ancestor)return false;ancestor=ancestor.parent;}
            return true;
        }
        function visit(node){for(const c of node.children)if(c instanceof Element){if(selector.split(',').some(s => matches(c,s)))found.push(c);visit(c);}}
        visit(this);return found;
    }
    querySelector(s){return this.querySelectorAll(s)[0]??null;}
    reset(){for(const e of this.querySelectorAll('input, textarea'))e.value='';}
}
function parse(html){
    const document=new Element('document');const stack=[document];
    for(const token of html.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g)){
        if(token.startsWith('<!'))continue;
        if(token.startsWith('</')){stack.pop();continue;}
        if(token.startsWith('<')){
            const tag=token.match(/^<([\w-]+)/)[1];const attrs={};
            for(const m of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[m[1]]=decode(m[2]??'');
            const element=new Element(tag,attrs);stack.at(-1).append(element);
            if(!['meta','link','input','img','path','circle','br','hr'].includes(tag)&&!token.endsWith('/>'))stack.push(element);
        }else stack.at(-1).append(decode(token));
    }
    document.documentElement=document.querySelector('html');document.baseURI='https://example.com/portfolio/';
    document.getElementById=id=>document.querySelector(`#${id}`);
    document.createElement=tag=>new Element(tag);
    return document;
}
const scripts=Object.fromEntries(['translations','i18n','theme','script'].map(n=>[n,fs.readFileSync(`js/${n}.js`,'utf8')]));
function setup(page,{saved=null,blocked=false,fetch=async()=>({ok:true,status:200}),theme='dark'}={}){
    const document=parse(fs.readFileSync(`${page}.html`,'utf8'));
    const unchanged=new Set(['Matej','ZV','GitHub','HTML','CSS','JavaScript','TypeScript','SQL','Git','C#','Academia Maribor','SERŠ Maribor','Codecademy','Udemy','Mosh Hamedani','C# Intermediate','C# Intermediate: Classes, Interfaces and OOP','Learn C# Course','Learn JavaScript Course','developer.js','English','Slovenščina','Deutsch','🇬🇧','🇸🇮','🇩🇪','✓','→','↗','☰','©','2026']);
    function checkCoverage(node,exempt=false){
        exempt ||= ['script','pre'].includes(node.tag) || node.getAttribute('data-i18n')!==null || node.classList.contains('hero-visual');
        for(const child of node.children){
            if(child instanceof Element)checkCoverage(child,exempt);
            else if(!exempt && child.trim())assert(unchanged.has(child.trim()),`${page}: untranslated text ${child.trim()}`);
        }
        for(const attr of ['aria-label','placeholder']){
            const value=node.getAttribute(attr);
            if(value && value!=='you@example.com')assert(node.getAttribute(`data-i18n-${attr}`),`${page}: untranslated ${attr}: ${value}`);
        }
    }
    checkCoverage(document);
    // English markup must match its source key, not merely reference an existing key.
    const dictionaryContext={window:{}};vm.createContext(dictionaryContext);vm.runInContext(scripts.translations,dictionaryContext);
    for(const node of document.querySelectorAll('[data-i18n]')){
        const key=node.attrs['data-i18n'];
        assert.equal(node.textContent.replace(/\s+/g,' ').trim(),dictionaryContext.window.portfolioTranslations.en[key],`${page}: English source mismatch for ${key}`);
    }
    const store=new Map([['portfolio-theme',theme]]);if(saved!==null)store.set('portfolio-language',saved);
    const window=new Element('window');window.innerWidth=375;window.scrollX=0;window.scrollY=450;window.scrollTo=({left,top})=>{assert.equal(left,0);assert.equal(top,450);};window.localStorage={getItem(k){if(blocked)throw Error('blocked');return store.get(k)??null;},setItem(k,v){if(blocked)throw Error('blocked');store.set(k,v);}};
    const media={matches:false,addEventListener(){}};window.matchMedia=()=>media;
    let timer;window.setTimeout=fn=>{timer=fn;return 1;};window.clearTimeout=()=>{};
    const context={document,window,URL,Date,AbortController,FormData:class {},fetch,ResizeObserver:class {observe(){}},Object};
    vm.createContext(context);
    for(const name of ['translations','i18n','theme'])vm.runInContext(scripts[name],context);
    context.portfolioI18n=window.portfolioI18n;
    window.portfolioI18n.apply();vm.runInContext(scripts.script,context);
    return {document,store,context,window,api:window.portfolioI18n,mount:()=>document.fire('DOMContentLoaded'),timeout:()=>timer()};
}
(async()=>{
    const pages=['index','projects','background','contact'];
    let dictionaries;
    for(const page of pages){
        const s=setup(page);await s.mount();dictionaries=s.window.portfolioTranslations;
        assert.equal(s.api.language,'en');
        const nodes=s.document.querySelectorAll('[data-i18n], [data-i18n-aria-label], [data-i18n-placeholder], [data-i18n-content]');
        const year=s.document.getElementById('current-year');const originalYear=year.textContent;
        for(const lang of ['sl','de','en']){
            const button=s.document.querySelector(`[data-language="${lang}"]`);assert.equal(button.attrs.type,'button');assert.equal(button.attrs.lang,lang);
            assert(s.document.querySelector('legend').attrs['data-i18n']==='settings.language');
            await button.fire('click');assert.equal(s.document.documentElement.lang,lang);assert.equal(s.store.get('portfolio-language'),lang);
            assert.equal(button.attrs['aria-pressed'],'true');assert.equal(s.document.querySelectorAll('[aria-pressed="true"]').length,1);
            for(const node of nodes){
                for(const attr of ['data-i18n','data-i18n-aria-label','data-i18n-placeholder','data-i18n-content']){
                    const key=node.getAttribute(attr);if(!key)continue;
                    assert(Object.hasOwn(dictionaries[lang],key),`${page}/${lang}: missing ${key}`);
                    const actual=attr==='data-i18n'?node.textContent:node.getAttribute(attr.slice(10));
                    const params=JSON.parse(node.attrs['data-i18n-params']||'{}');assert.equal(actual,s.api.t(key,params),`${page}/${key}`);
                }
            }
            assert.strictEqual(year,s.document.getElementById('current-year'));assert.equal(year.textContent,originalYear);
            for(const nextPage of pages){const next=setup(nextPage,{saved:s.store.get('portfolio-language')});await next.mount();assert.equal(next.document.documentElement.lang,lang);}
        }
        await s.document.querySelector('.menu-toggle').fire('click');
        s.api.setLanguage('de');assert.equal(s.document.querySelector('.menu-toggle').attrs['aria-label'],dictionaries.de['access.menuClose']);
        await s.document.fire('keydown',{key:'Escape'});assert.equal(s.document.querySelector('.menu-toggle').attrs['aria-label'],dictionaries.de['access.menuOpen']);
        // Theme changes must not change the language, and language changes must not change theme.
        s.api.setLanguage('sl');const themeSelect=s.document.getElementById('theme-choice');themeSelect.value='light';await themeSelect.fire('change');
        assert.equal(s.api.language,'sl');assert.equal(s.document.documentElement.attrs['data-theme'],'light');s.api.setLanguage('de');assert.equal(themeSelect.value,'light');
        // Escape behavior remains owned by the existing Settings code.
        const settings=s.document.getElementById('settings-toggle');await settings.fire('click');assert(!s.document.getElementById('settings-panel').hidden);
        await s.document.fire('keydown',{key:'Escape'});assert(s.document.getElementById('settings-panel').hidden);assert(settings.focused);
        if(page==='background'){
            const certificateLinks=s.document.querySelectorAll('.certificate-link');assert.equal(certificateLinks.length,3);
            const udemy=s.document.getElementById('udemy-csharp-course-heading');
            assert.equal(udemy.textContent,'C# Intermediate');
            assert.equal(udemy.attrs.title,'C# Intermediate: Classes, Interfaces and OOP');
            const card=udemy.parent.parent;
            for(const lang of ['en','sl','de']){
                s.api.setLanguage(lang);
                assert.equal(card.querySelector('.certificate-link').attrs['aria-label'],dictionaries[lang]['certificate.udemyLabel']);
                assert.equal(card.querySelector('.learning-provider').textContent,'Udemy');
                for(const link of certificateLinks)assert.equal(link.textContent.trim().replace(/\s+/g,' '),dictionaries[lang]['certificate.view']);
                assert.equal(udemy.textContent,'C# Intermediate');
                assert.equal(udemy.attrs.title,'C# Intermediate: Classes, Interfaces and OOP');
            }
        }
        if(page==='projects'){
            s.api.setLanguage('sl');assert.equal(s.document.querySelector('.project-content h3').textContent,dictionaries.sl['projects.nova.title']);
            assert.equal(s.document.querySelector('.project-content p').textContent,dictionaries.sl['projects.nova.description']);
            const card=s.document.querySelector('.project-card');s.api.setLanguage('de');assert.strictEqual(card,s.document.querySelector('.project-card'));
            assert.equal(s.document.querySelector('.project-status').textContent,dictionaries.de['status.progress']);
            const fixture={title:'Fixture',description:'Fixture',technologies:['HTML'],icon:'X',status:'completed',demoUrl:'https://example.com/',repositoryUrl:''};
            const optional=s.context.createProjectCard(fixture);s.document.querySelector('#projects-container').append(optional);s.api.setLanguage('sl');
            assert.equal(optional.querySelector('.project-link').textContent,dictionaries.sl['projects.demo']);
            assert.equal(optional.querySelector('.project-link').attrs['aria-label'],`${dictionaries.sl['projects.demo']}: Fixture`);
        }
    }
    assert.deepEqual(Object.keys(dictionaries.en).sort(),Object.keys(dictionaries.sl).sort());assert.deepEqual(Object.keys(dictionaries.en).sort(),Object.keys(dictionaries.de).sort());
    for(const saved of ['invalid','__proto__',null]){const s=setup('index',{saved});await s.mount();assert.equal(s.api.language,'en');s.api.setLanguage('invalid');assert.equal(s.api.language,'en');}
    const blocked=setup('contact',{blocked:true});await blocked.mount();blocked.api.setLanguage('de');assert.equal(blocked.document.documentElement.lang,'de');
    const cross=setup('background',{saved:'sl'});await cross.mount();cross.store.set('portfolio-language','de');await cross.window.fire('storage',{key:'portfolio-language'});assert.equal(cross.api.language,'de');cross.store.delete('portfolio-language');await cross.window.fire('storage',{key:null});assert.equal(cross.api.language,'en');
    function fields(s){return ['contact-name','contact-email','contact-message'].map(id=>s.document.getElementById(id));}
    for(const lang of ['en','sl','de']){
        for(const status of [200,400,429,500,'network','timeout']){
            let calls=0;
            const s=setup('contact',{saved:lang,fetch:async(url,options)=>{
                calls++;assert.equal(url,'https://formspree.io/f/xzeeqwby');
                if(status==='network')throw Error('offline');
                if(status==='timeout')return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))));
                return {ok:status===200,status};
            }});await s.mount();const form=s.document.getElementById('contact-form');const statusNode=s.document.getElementById('form-status');
            await form.fire('submit',{preventDefault(){}});assert.equal(calls,0);
            for(const [id,key] of [['name-error','form.nameError'],['email-error','form.emailError'],['message-error','form.messageError']])assert.equal(s.document.getElementById(id).textContent,dictionaries[lang][key]);
            assert.equal(statusNode.textContent,dictionaries[lang]['form.invalid']);
            const inputs=fields(s);inputs.forEach((e,i)=>{e.value=['Jane','jane@example.com','A message long enough.'][i];});
            const endpoint=form.attrs.action;
            form.attrs.action='https://formspree.io/f/YOUR_FORM_ID';
            await form.fire('submit',{preventDefault(){}});assert.equal(calls,0);
            assert.equal(statusNode.textContent,dictionaries[lang]['form.unconfigured']);form.attrs.action=endpoint;
            const pending=form.fire('submit',{preventDefault(){}});
            assert.equal(statusNode.textContent,dictionaries[lang]['form.sending']);
            const other=lang==='de'?'sl':'de';s.api.setLanguage(other);assert.equal(statusNode.textContent,dictionaries[other]['form.sending']);
            assert.strictEqual(inputs[0],fields(s)[0]);assert.equal(inputs[0].value,'Jane');assert(inputs[0].readOnly);
            await form.fire('submit',{preventDefault(){}});assert.equal(calls,1);
            if(status==='timeout')s.timeout();await pending;
            const key=status===200?'form.success':status===429?'form.rateLimit':status==='network'?'form.network':status==='timeout'?'form.timeout':'form.http';
            assert.equal(statusNode.textContent,s.api.t(key,{status}));assert.equal(s.document.getElementById('contact-submit').textContent,s.api.t('contact.send'));
            assert.equal(inputs[0].value,status===200?'':'Jane');assert(!inputs[0].readOnly);
            s.api.setLanguage(lang);assert.equal(statusNode.textContent,s.api.t(key,{status}));
            await inputs[0].fire('input');s.api.setLanguage(other);assert.equal(statusNode.textContent,'');assert.equal(s.document.getElementById('name-error').textContent,'');
        }
    }
    console.log('Passed: all-page en/sl/de switching and coverage, metadata/ARIA, saved/invalid/blocked storage, cross-tab updates, document language, native Settings buttons/Escape, independent theme preferences, project identity/optional links, and translated validation, sending, HTTP, network, success and timeout states without form-state loss.');
})().catch(error=>{console.error(error);process.exitCode=1;});
