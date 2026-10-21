import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import type { Nodes } from 'mdast';

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);
const diagramComponents = new Set([
  'PipelineFig',
  'LinkedListFig',
  'ScriptFig',
  'TakeHomeFig',
  'ReviewLoopFig',
]);

type Replacement = Readonly<{ start: number; end: number; text: string }>;

export function markdownText(value: string): string {
  return value.replace(/[\\`*_[\]<>]/g, '\\$&');
}

/** Keep authored Markdown and code intact. Only actual MDX nodes are replaced. */
export function articleBody(source: string, canonical: string): string {
  const tree = parser.parse(source);
  const replacements: Replacement[] = [];
  const replace = (node: Nodes, text: string) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) {
      throw new Error(`Missing MDX source position in ${canonical}`);
    }
    replacements.push({ start, end, text });
  };
  const unsupported = (node: Nodes): never => {
    throw new Error(
      `Unsupported ${node.type} at ${canonical}:${node.position?.start.line ?? '?'}; add a Markdown representation.`,
    );
  };
  const visit = (node: Nodes): void => {
    switch (node.type) {
      case 'mdxjsEsm':
        replace(node, '');
        return;
      case 'mdxJsxFlowElement': {
        const label = node.attributes.find(
          (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'aria-label',
        );
        const className = node.attributes.find(
          (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'class',
        );
        const role = node.attributes.find(
          (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'role',
        );
        const tabIndex = node.attributes.find(
          (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'tabIndex',
        );
        const figure = node.children[0];
        if (
          node.name !== 'div' ||
          node.attributes.length !== 4 ||
          role?.type !== 'mdxJsxAttribute' ||
          role.value !== 'region' ||
          tabIndex?.type !== 'mdxJsxAttribute' ||
          typeof tabIndex.value !== 'object' ||
          tabIndex.value?.value !== '0' ||
          className?.type !== 'mdxJsxAttribute' ||
          className.value !== 'diagram-scroll' ||
          label?.type !== 'mdxJsxAttribute' ||
          typeof label.value !== 'string' ||
          node.children.length !== 1 ||
          figure?.type !== 'mdxJsxFlowElement' ||
          !figure.name ||
          !diagramComponents.has(figure.name) ||
          figure.attributes.length !== 0 ||
          figure.children.length !== 0
        ) {
          return unsupported(node);
        }
        replace(
          node,
          `[${markdownText(label.value)}. View the visual in the HTML article.](${canonical})`,
        );
        return;
      }
      case 'mdxFlowExpression':
      case 'mdxTextExpression':
      case 'mdxJsxTextElement':
      case 'html':
        return unsupported(node);
    }
    if ('children' in node) node.children.forEach(visit);
  };
  visit(tree);

  let result = source;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, replacement.start) + replacement.text + result.slice(replacement.end);
  }
  return result.trim();
}
