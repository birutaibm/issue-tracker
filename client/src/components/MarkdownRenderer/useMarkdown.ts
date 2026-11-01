import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { renderers } from './renderers/index.js';
import { Renderer } from 'marked';

// Create custom renderer by extending the default renderer
const customRenderer = new Renderer();
customRenderer.image = renderers.image;
customRenderer.code = renderers.code;
customRenderer.listitem = renderers.listitem;

const markedOptions = {
  renderer: customRenderer,
  async: true,
  gfm: true,
};

marked.setOptions(markedOptions);

interface RenderContext {
  projectSlug: string;
  cardSlug: string;
}

// Preprocess markdown to normalize task list syntax
function preprocessTaskLists(markdown: string): string {
  // Normalize task list checkboxes: [x] -> [X], [ ] -> [ ]
  // Also handle cases where there might be multiple spaces
  return markdown
    .replace(/^(\s*)-\s+\[x\]\s+/gim, '$1- [X] ')
    .replace(/^(\s*)-\s+\[\s*\]\s+/g, '$1- [ ] ');
}

export async function renderMarkdown(markdown: string, context: RenderContext): Promise<string> {
  if (!markdown.trim()) return '';

  console.log('[renderMarkdown] Input markdown:', markdown.substring(0, 100));

  // Preprocess markdown to normalize task list syntax
  const processedMarkdown = preprocessTaskLists(markdown);

  console.log('[renderMarkdown] Processed markdown:', processedMarkdown.substring(0, 100));

  // Parse markdown to HTML
  let html = await marked.parse(processedMarkdown, markedOptions);

  console.log('[renderMarkdown] Parsed HTML:', html.substring(0, 200));

  // Replace asset path placeholders
  html = html.replace(
    /__ASSET_PATH__/g,
    `/api/projects/${context.projectSlug}/assets/${context.cardSlug}`
  );

  // Sanitize HTML
  html = DOMPurify.sanitize(html);

  console.log('[renderMarkdown] Sanitized HTML:', html.substring(0, 200));

  return html;
}
