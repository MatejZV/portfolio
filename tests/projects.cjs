const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
class Element {
  constructor(tag) { this.tag=tag;this.children=[];this.attrs={};this.events={};this.style={};this.textContent='';this.classList={add(){},toggle(){}}; }
  append(...nodes){nodes.forEach(n=>this.appendChild(n));}
  appendChild(n){n.parent=this;this.children.push(n);}
  replaceChildren(){this.children=[];}
  remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.events[k]=fn;}
  get childElementCount(){return this.children.length;}
}
const grid=new Element('div');
const context={URL,document:{baseURI:'https://portfolio.example/repository/',createElement:tag=>new Element(tag),querySelector:s=>{assert.equal(s,'#projects-container');return grid;}}};
vm.createContext(context);
const source=fs.readFileSync('js/script.js','utf8');
vm.runInContext(source.slice(source.indexOf('const projects ='),source.indexOf('   7. CONTACT FORM ELEMENTS')).replace(/\/\* ==========================================\s*$/,''),context);
// Audit actual configured project paths separately from synthetic fixtures.
for (const project of vm.runInContext('projects', context)) {
  for (const value of [project.screenshot?.src, project.demoUrl, project.repositoryUrl]) {
    if (!value) continue;
    const url = new URL(value, context.document.baseURI);
    if (url.origin === 'https://portfolio.example') {
      assert(url.pathname.startsWith('/repository/'), `Project path escapes repository: ${value}`);
      const path = require('node:path').join(process.cwd(), decodeURIComponent(url.pathname.slice('/repository/'.length)));
      assert(fs.existsSync(path), `Missing local project asset or destination: ${value}`);
    }
  }
}
const configuredProjects = vm.runInContext('projects', context);
assert.deepEqual(Array.from(configuredProjects, p => p.title), ['NOVA — E-commerce Storefront', 'BetIQ — Football Probability Prototype']);
assert(configuredProjects.every(p => p.status === 'in-progress'));
assert(configuredProjects.every(p => p.screenshot === null && p.demoUrl === '' && p.repositoryUrl === ''));
assert.equal(grid.children.length,2);
const expectedTitles = ['NOVA — E-commerce Storefront', 'BetIQ — Football Probability Prototype'];
assert.deepEqual(grid.children.map(card => card.children[1].children[1].textContent), expectedTitles);
for (const [index, card] of grid.children.entries()) {
  const project = configuredProjects[index];
  const content = card.children[1];
  assert.equal(card.tag, 'article');
  assert.equal(content.children[0].textContent, 'In Progress');
  assert.equal(content.children[2].textContent, project.description);
  assert.deepEqual(content.children[3].children.map(tag => tag.textContent), Array.from(project.technologies));
  assert.equal(card.children[0].children.length, 1);
  assert.equal(content.children.length, 4);
}
// Re-rendering keeps both cards without duplication or category controls.
context.displayProjects();
assert.equal(grid.children.length, 2);
assert.deepEqual(grid.children.map(card => card.children[1].children[1].textContent), expectedTitles);
const fixture={title:'Test fixture',description:'Synthetic test data',technologies:['HTML'],icon:'X',status:'planned',screenshot:{src:'images/test.webp',alt:'A test interface'},demoUrl:'https://demo.example/',repositoryUrl:'https://github.example/repo'};
let card=context.createProjectCard(fixture);
const image=card.children[0],img=image.children[1];
assert.equal(img.alt,'A test interface');assert.equal(img.src,'https://portfolio.example/repository/images/test.webp');assert.equal(img.loading,'lazy');assert.equal(img.style.opacity,"0");
img.events.load();assert.equal(img.style.opacity,"1");assert.equal(image.children[0].hidden,true);
img.events.error();assert.equal(image.children.length,1);assert.equal(image.children[0].hidden,false);
const links=card.children[1].children.at(-1);assert.equal(links.children.length,2);assert.match(links.children[0].attrs['aria-label'],/Test fixture/);
assert.equal(card.children[1].children[0].textContent,'Planned');assert.equal(card.children[1].children[3].children[0].textContent,'HTML');
card=context.createProjectCard({...fixture,screenshot:{src:'images/test.webp',alt:''},demoUrl:'javascript:alert(1)',repositoryUrl:''});
assert.equal(card.children[0].children.length,1);assert.equal(card.children[1].children.length,4);
for(const value of ['',null,'javascript:alert(1)','data:text/html,test','http://[']) assert.equal(context.getProjectUrl(value),null);
console.log('Passed: both project cards, descriptions, technology tags, In Progress labels, repeat rendering, screenshot alt/loading/failure fallback, optional links, unsafe URL rejection, statuses and tags.');

assert.equal(context.getProjectUrl('index.html#work'), 'https://portfolio.example/repository/index.html#work');
console.log('Passed: repository-subpath screenshot and internal project URL resolution.');
for(const page of ['projects.html']) {
  const html=fs.readFileSync(page,'utf8');assert.match(html,/id="projects-container"/);
}
const noGrid={URL,document:{baseURI:'https://portfolio.example/repository/background.html',querySelector:()=>null}};
vm.createContext(noGrid);
vm.runInContext(source.slice(source.indexOf('const projects ='),source.indexOf('   7. CONTACT FORM ELEMENTS')).replace(/\/\* ==========================================\s*$/,''),noGrid);
assert.equal(new URL('projects.html','https://portfolio.example/repository/index.html').href,'https://portfolio.example/repository/projects.html');
console.log('Passed: dedicated gallery with no Home project cards and safe initialization on pages without a project grid.');

const home=fs.readFileSync('index.html','utf8');
assert(!/projects-container|Featured Projects|project-card/.test(home));
// Projects remains reachable through the shared primary navigation.
const homeNavigation = home.match(/<ul\b[^>]*id="primary-navigation"[^>]*>([\s\S]*?)<\/ul>/)[1];
assert.match(homeNavigation, /<a\b[^>]*href="projects.html"[^>]*>Projects<\/a>/);
