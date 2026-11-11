const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('js/script.js', 'utf8').split('   7. CONTACT FORM ELEMENTS')[1].split('   14. AUTOMATIC COPYRIGHT YEAR')[0];
const html = fs.readFileSync('contact.html', 'utf8');
const action = html.match(/<form\b[^>]*id="contact-form"[^>]*action="([^"]+)"/)[1];
assert.match(action, /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/);
assert(!action.includes('YOUR_FORM_ID'));
const code = source.slice(source.indexOf('// Find the contact form'), source.lastIndexOf('/* =========================================='));
function setup(fetch) {
  const elements = {};
  for (const id of ['contact-form','contact-name','contact-email','contact-message','name-error','email-error','message-error','form-status','contact-submit']) {
    elements[id] = { value: '', textContent: '', attrs: {}, listeners: {}, classList: { add(){},remove(){} }, setAttribute(k,v){this.attrs[k]=v;}, addEventListener(k,v){this.listeners[k]=v;}, focus(){this.focused=true;} };
  }
  const form = elements['contact-form'];
  const fields = ['contact-name','contact-email','contact-message'].map(id=>elements[id]);
  fields.forEach((e,i)=>e.value=['Jane','jane@example.com','A message with enough text.'][i]);
  form.action=action;
  form.querySelector=()=>fields.find(e=>e.attrs['aria-invalid']==='true');
  form.reset=()=>fields.forEach(e=>e.value='');
  elements['contact-submit'].textContent='Send Message';
  let timer, cleared=false;
  vm.runInNewContext(code,{document:{querySelector:s=>elements[s.slice(1)]},window:{setTimeout(fn,ms){assert.equal(ms,15000);timer=fn;return 1;},clearTimeout(){cleared=true;}},AbortController,FormData:class {},fetch});
  return {elements,fields,form,submit:()=>form.listeners.submit({preventDefault(){}}),timeout:()=>timer(),clean:()=>{assert(cleared);assert.equal(elements['contact-submit'].disabled,false);assert.equal(elements['contact-submit'].textContent,'Send Message');fields.forEach(e=>assert.equal(e.readOnly,false));}};
}
(async()=>{
  for (const status of [200,400,429,500]) {
    const s=setup(async(url,options)=>{
      assert.equal(url,action);assert.equal(options.method,'POST');
      assert.equal(options.headers.Accept,'application/json');
      assert(options.body);assert(options.signal);
      return {ok:status===200,status};
    });await s.submit();s.clean();assert.equal(s.fields[0].value,status===200?'':'Jane');assert.match(s.elements['form-status'].textContent,status===200?/Formspree accepted/:status===429?/Too many/:new RegExp(`HTTP ${status}`));
  }
  const n=setup(async()=>{throw new TypeError('offline');});await n.submit();n.clean();assert.equal(n.fields[0].value,'Jane');assert.match(n.elements['form-status'].textContent,/network error/);
  let calls=0;
  const t=setup((url,options)=>{calls++;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))));});
  const pending=t.submit();await t.submit();assert.equal(calls,1);assert.equal(t.elements['contact-submit'].disabled,true);t.timeout();await pending;t.clean();assert.match(t.elements['form-status'].textContent,/timed out/);assert.equal(t.fields[0].value,'Jane');
  const invalid=setup(()=>{throw new Error('must not fetch');});invalid.fields[0].value='';await invalid.submit();assert(invalid.fields[0].focused);
  const missing=setup(()=>{throw new Error('must not fetch');});missing.form.action='https://formspree.io/f/YOUR_FORM_ID';await missing.submit();assert.match(missing.elements['form-status'].textContent,/not set up/);
  console.log('Passed: configured endpoint agreement, service acceptance, HTTP 400/429/500, network failure, abort timeout, duplicate submission, validation focus, missing configuration, value preservation, and finally cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
