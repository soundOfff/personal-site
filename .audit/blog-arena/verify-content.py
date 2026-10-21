from html.parser import HTMLParser
from pathlib import Path
import json, sys

class BlogDocument(HTMLParser):
    def __init__(self):
        super().__init__()
        self.level = 0
        self.prose_level = None
        self.prose = []
        self.title = []
        self.in_title = False
        self.metadata = {}
        self.h1 = 0
        self.film_assets = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.level += 1
        if 'prose' in attrs.get('class','').split():
            self.prose_level = self.level
        if tag == 'title': self.in_title = True
        if tag == 'h1': self.h1 += 1
        if tag == 'meta' and attrs.get('name') == 'description': self.metadata['description'] = attrs.get('content')
        if tag == 'link' and attrs.get('rel') == 'canonical': self.metadata['canonical'] = attrs.get('href')
        if tag == 'link' and ('data-reel-css' in attrs or 'data-camera-css' in attrs): self.film_assets.append(attrs)
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if self.prose_level == self.level: self.prose_level = None
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.level -= 1
    def handle_data(self, data):
        if self.prose_level is not None: self.prose.append(data)
        if self.in_title: self.title.append(data)

root = Path(sys.argv[1])
result = {}
for path in sorted((root/'blog').rglob('index.html')):
    doc = BlogDocument(); doc.feed(path.read_text())
    name = str(path.relative_to(root))
    assert doc.h1 == 1, (name, 'expected one h1', doc.h1)
    assert all(doc.metadata.get(key) for key in ['description','canonical']), (name, 'missing SEO')
    assert not doc.film_assets, (name, 'film assets present')
    result[name] = {**doc.metadata, 'title': ''.join(doc.title), 'prose': ' '.join(' '.join(doc.prose).split())}
assert len(result) == 12, ('expected archive plus 11 published articles', len(result))
record = Path('.audit/blog-arena/content-baseline.json')
if '--record' in sys.argv:
    record.write_text(json.dumps(result, indent=2))
else:
    expected = json.loads(record.read_text())
    assert expected == result, 'Blog content, metadata or routes changed'
print(f'PASS. {len(result)} blog routes, one h1 each, SEO present, no film stylesheet hooks, article text and metadata preserved.')
