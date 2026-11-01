import type { Highlighter } from 'shiki';

let highlighter: Highlighter | null = null;

export async function getShikiHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    const { getHighlighter } = await import('shiki');
    highlighter = await getHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'typescript',
        'javascript',
        'python',
        'json',
        'bash',
        'sql',
        'markdown',
        'html',
        'css',
        'yaml',
        'dockerfile',
        'rust',
        'go',
      ],
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getShikiHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
  });
}
