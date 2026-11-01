import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { renderers } from './renderers/index.js';
import { Renderer } from 'marked';

// Create custom renderer by extending the default renderer
const customRenderer = new Renderer();
customRenderer.image = renderers.image;
customRenderer.code = renderers.code;
customRenderer.listitem = renderers.listitem;
customRenderer.checkbox = renderers.checkbox;

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

export async function renderMarkdown(markdown: string, context: RenderContext): Promise<string> {
  if (!markdown.trim()) return '';

  // Parse markdown to HTML
  let html = await marked.parse(markdown, markedOptions);

  // Replace asset path placeholders
  html = html.replace(
    /__ASSET_PATH__/g,
    `/api/projects/${context.projectSlug}/assets/${context.cardSlug}`
  );

  // Sanitize HTML
  html = DOMPurify.sanitize(html);

  return html;
}
