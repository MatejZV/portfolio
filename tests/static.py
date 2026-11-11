"""Check every static page, cross-page anchors, PDFs, and repository-relative assets."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit, urljoin
import re

root = Path(__file__).resolve().parents[1]
page_names = ['index.html', 'projects.html', 'background.html', 'contact.html']
nav = [('index.html','Home'),('projects.html','Projects'),('background.html','Background'),('contact.html','Contact Me')]
class Audit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.references, self.assets, self.labels, self.fields = [], [], [], set(), []
        self.h1_count = 0
        self.stack = []
        self.images = []
    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        assert tag != 'base'
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append(tag)
        if 'id' in a: self.ids.append(a['id'])
        for key in ('aria-describedby','aria-controls','aria-labelledby'): self.references.extend(a.get(key,'').split())
        if tag == 'h1': self.h1_count += 1
        if tag == 'label': self.labels.add(a.get('for'))
        if tag in ('input','textarea','select'): self.fields.append(a.get('id'))
        if tag == 'img':
            assert 'alt' in a
            self.images.append(a)
        if tag == 'a' and a.get('target') == '_blank': assert {'noopener','noreferrer'} <= set(a.get('rel','').split())
        for key in ('href','src','data-certificate-pdf'):
            if a.get(key): self.assets.append(a[key])
    def handle_endtag(self, tag):
        assert self.stack and self.stack.pop() == tag, f'Bad nesting: {tag}'
    def handle_startendtag(self,tag,attrs): pass

pages = {}
for name in page_names:
    audit = Audit(); text = (root/name).read_text(); audit.feed(text)
    assert not audit.stack
    assert audit.h1_count == 1, name
    assert all(count == 1 for count in Counter(audit.ids).values()), name
    assert set(audit.references) <= set(audit.ids), name
    assert set(audit.fields) <= audit.labels, name
    assert '<html lang="en">' in text and 'name="viewport"' in text
    assert '<link rel="icon" type="image/svg+xml" sizes="any" href="assets/icons/favicon.svg">' in text
    assert 'js/theme.js' in text and 'js/script.js' in text
    assert 'id="current-year"' in text
    footer = re.search(r'<footer class="site-footer">[\s\S]*?</footer>', text).group()
    assert re.fullmatch(
        r'<footer class="site-footer">\s*<p>&copy; <span id="current-year">\d{4}</span> '
        r'<span data-i18n="footer.rights">Matej ZV\. All rights reserved\.</span></p>\s*</footer>', footer
    ), name
    assert footer == re.search(r'<footer class="site-footer">[\s\S]*?</footer>', (root/'index.html').read_text()).group(), name
    assert 'display-size' not in text
    header = re.search(r'<header[\s\S]*?</header>',text).group()
    primary = re.search(r'<ul class="nav-links"[\s\S]*?</ul>',header).group()
    found = [(href,label) for href,label in re.findall(r'<a href="([^"]+)"(?: aria-current="page")? data-i18n="[^"]+">([^<]+)</a>',primary)]
    assert found == nav, (name,found)
    assert 'href="index.html"' in header and 'Matej <span>ZV</span>' in header
    assert 'about.html' not in text
    for attrs in re.findall(r'<a\b([^>]+)>',text):
        if re.search(r'href="[^":]*\.html(?:#[^"]*)?"',attrs): assert 'target=' not in attrs
    currents = re.findall(r'<a\b(?=[^>]*aria-current="page")(?=[^>]*href="([^"]+)")[^>]*>',header)
    assert currents == ([name,name] if name == 'contact.html' else [name]), (name,currents)
    assert ('id="contact-form"' in text) == (name == 'contact.html')
    assert ('id="projects-container"' in text) == (name == 'projects.html')
    pages[name] = audit

for name,audit in pages.items():
    for reference in audit.assets:
        url = urlsplit(reference)
        if url.scheme or url.netloc: continue
        assert not reference.startswith('/'), reference
        resolved = urlsplit(urljoin('https://portfolio.example/repository/'+name,reference))
        assert resolved.path.startswith('/repository/'), reference
        target = unquote(url.path) or name
        assert (root/target).is_file(), (name,reference)
        if url.fragment:
            assert target in pages and unquote(url.fragment) in pages[target].ids, (name,reference)
        if target.endswith('.pdf'): assert (root/target).read_bytes().startswith(b'%PDF-')
for reference in re.findall(r'url\([\s\'"]*([^\)\'\"]+)',(root/'css/style.css').read_text()):
    url = urlsplit(reference)
    if not url.scheme and not url.netloc:
        assert not reference.startswith('/')
        assert (root/'css'/unquote(url.path)).is_file()
certificates = (root/'background.html').read_text()
for key in ['csharp','javascript']:
    assert f'assets/certificates/codecademy-learn-{key}.pdf' in certificates
    assert f'assets/certificates/codecademy-learn-{key}.webp' in certificates
certificate_section = re.search(r'<section\b[^>]*id="learning"[\s\S]*?</section>', certificates).group()
certificate_cards = re.findall(r'<article class="learning-card"[\s\S]*?</article>', certificate_section)
assert len(certificate_cards) == 3
intermediate = certificate_cards[2]
assert '<h3 id="intermediate-course-heading">Learn Intermediate C#</h3>' in intermediate
assert 'data-i18n="status.progress">In Progress' in intermediate
assert 'data-i18n="course.progress">Progress snapshot: 40%' in intermediate
assert 'data-i18n="status.completed"' not in intermediate
assert 'data-certificate-preview' not in intermediate and '<img' not in intermediate
assert 'href="https://www.codecademy.com/enrolled/courses/learn-intermediate-c-sharp"' in intermediate
assert '<details class="course-details">' in intermediate
assert certificates.count('data-certificate-preview') == 2
for card in certificate_cards[:2]:
    assert 'data-i18n="status.completed">Completed' in card
for card in certificate_cards:
    assert 'learning-card-header' not in card and 'learning-completion' not in card
    assert len(re.findall(r'<h3\b', card)) == 1
    assert 'class="learning-provider"' in card and 'class="certificate-link"' in card
home = (root/'index.html').read_text()
assert home.index('id="home"') < home.index('id="about"') < home.index('class="closing-cta"')
assert 'Always Learning' not in home
assert not (root/'about.html').exists()
# The hero button was intentionally removed; primary navigation still links to Projects.
assert 'projects.html' in pages['index.html'].assets
assert 'id="work"' not in home and 'Featured Projects' not in home and 'projects-container' not in home
assert 'id="contact-form"' not in home
background = (root/'background.html').read_text()
assert background.index('id="education"') < background.index('id="skills"') < background.index('id="learning"')
# The jump menu is optional; verify its destinations if it is present.
if 'aria-label="Background sections"' in background:
    for anchor in ['education','skills','learning']:
        assert f'href="#{anchor}"' in background
print('Passed: all four pages, one h1 each, HTML nesting, IDs/ARIA/labels, ordered navbar/current-page states, brand/home, same-tab page links, cross-page anchors, local assets/PDFs, and repository-subpath resolution.')
print('Browser rendering, horizontal overflow, actual focus/zoom, and real inbox delivery remain unverified. No messages submitted.')

assert '<title data-i18n="meta.home.title">Matej ZV | Aspiring Software Developer</title>' in home
assert '<meta property="og:title" content="Matej ZV | Aspiring Software Developer" data-i18n-content="meta.home.title">' in home
from xml.etree import ElementTree
favicon = ElementTree.parse(root/'assets/icons/favicon.svg').getroot()
assert favicon.tag == '{http://www.w3.org/2000/svg}svg'
assert favicon.attrib['viewBox'] == '0 0 32 32'
