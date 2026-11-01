import type { RendererObject } from 'marked';

export const imageRenderer = (href: string, title: string | null, text: string): string => {
  if (href.startsWith('./') || href.startsWith('../')) {
    const clean = href.replace(/^\.?\//, '');
    href = '__ASSET_PATH__/' + clean;
  }
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" />`;
};

export const codeRenderer = (code: string, language: string | undefined): string => {
  const lang = (language || 'text').trim().split(/\s+/)[0] || 'text';
  if (lang === 'mermaid') {
    return `<div class="mermaid">${escapeHtml(code)}</div>`;
  }
  return `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>`;
};

export const checkboxRenderer = (checked: boolean): string => {
  const checkedAttr = checked ? ' checked=""' : '';
  return `<input type="checkbox" class="task-list-item-checkbox"${checkedAttr} disabled="" />`;
};

export const taskListRenderer = (text: string, task: boolean): string => {
  return task ? `<li class="task-list-item">${text}</li>` : `<li>${text}</li>`;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const renderers: RendererObject = {
  image: imageRenderer,
  code: codeRenderer,
  listitem: taskListRenderer,
  checkbox: checkboxRenderer,
};
