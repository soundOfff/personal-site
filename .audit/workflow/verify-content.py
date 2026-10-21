from html.parser import HTMLParser
from pathlib import Path
import json

EXPECTED = [
    'Frame the problem',
    'Understand, then choose',
    'Build one useful slice',
    'Check the real result',
    'Make the final call',
]

class WorkflowPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.capture = None
        self.headings = []
        self.owners = []
        self.links = []
        self.text = []
        self.diagram = False
        self.ordered = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if tag == 'section' and attrs.get('id') == 'principles':
            assert attrs.get('data-sec') == '6', 'section identity stays stable'
            self.active = True
        if not self.active:
            return
        if tag == 'figure' and 'workflow' in classes:
            self.diagram = True
        if tag == 'ol' and 'workflow-stages' in classes:
            self.ordered = True
        if tag == 'h3':
            self.headings.append('')
            self.capture = self.headings
        if tag == 'p' and 'workflow-owner' in classes:
            self.owners.append('')
            self.capture = self.owners
        if tag == 'a':
            self.links.append(attrs.get('href'))

    def handle_endtag(self, tag):
        if tag in ('h3', 'p'):
            self.capture = None
        if tag == 'section':
            self.active = False

    def handle_data(self, data):
        if self.active:
            self.text.append(data)
            if self.capture is not None:
                self.capture[-1] += data

page = WorkflowPage()
page.feed(Path('dist/client/index.html').read_text())
snapshot = json.loads(Path('dist/client/data/portfolio.json').read_text())
principles = snapshot['principles']
assert page.diagram and page.ordered, 'diagram is semantic HTML in the built page'
assert page.headings == EXPECTED, (page.headings, EXPECTED)
assert [stage['title'] for stage in principles] == EXPECTED, 'agent and page expose the same process order'
assert all(set(stage) == {'title', 'body'} for stage in principles), 'public principles contract stays unchanged'
assert page.owners == ['Me', 'Agents + me', 'Agents + me', 'Agents + me', 'Me'], page.owners
visible = ' '.join(page.text)
agent = ' '.join(stage['body'] for stage in principles)
for skill in ['grilling', 'to-prd', 'to-issues', 'how', 'architect', 'arena', 'design-an-interface', 'tdd', 'codebase-design', 'code-review', 'interrogate']:
    assert skill in visible and skill in agent, f'{skill} reaches the page and agent context'
for text in ['For larger work', 'When the design is uncertain', 'Failed checks return to the slice.', 'A wrong approach returns to design.']:
    assert text in visible and text in agent, f'conditional process meaning is preserved: {text}'
for old in ['Test before changing models', 'Cache repeated work', 'Set limits before launch', 'Turn failures into test cases']:
    assert old not in visible and old not in agent, f'obsolete principle removed: {old}'
assert 'https://github.com/michael-denyer/pstack-claude' in page.links
assert 'https://github.com/mattpocock/skills' in page.links
print('PASS: five stages, human ownership, skill attribution, conditions and feedback agree in built HTML and portfolio JSON. Existing snapshot contract preserved.')
