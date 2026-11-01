import type { RendererObject } from 'marked';

export const imageRenderer = (href: string, title: string | null, text: string): string => {
  if (href.startsWith('./') || href.startsWith('../')) {
    const clean = href.replace(/^\.?\//, '');
    href = '__ASSET_PATH__/' + clean;
  }
  const titleAttr = title ? ' title="' + title.replace(/"/g, '"') + '"' : '';
  return (
    '<img src="' +
    href +
    '" alt="' +
    text.replace(/"/g, '"') +
    '"' +
    titleAttr +
    ' loading="lazy" />'
  );
};

export const codeRenderer = (code: string, language: string | undefined): string => {
  const lang = language || 'text';
  if (lang === 'mermaid') {
    return '<div class="mermaid">' + escapeHtml(code) + '</div>';
  }
  return '<pre><code class="language-' + lang + '">' + escapeHtml(code) + '</code></pre>';
};

export const taskListRenderer = (text: string, task: boolean, checked: boolean): string => {
  if (!task) return '<li>' + text + '</li>';
  const checkbox =
    '<input type="checkbox" class="task-list-item-checkbox" ' +
    (checked ? 'checked="checked"' : '') +
    ' disabled /> ';
  return '<li class="task-list-item">' + checkbox + text + '</li>';
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

export const renderers: RendererObject = {
  image: imageRenderer,
  code: codeRenderer,
  listitem: taskListRenderer,
};
