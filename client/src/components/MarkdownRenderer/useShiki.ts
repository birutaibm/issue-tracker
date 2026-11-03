import type { BundledLanguage, Highlighter } from 'shiki';

const FALLBACK_LANGUAGE = 'text';

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
        'vue',
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
  const requested = lang.trim().toLowerCase() || FALLBACK_LANGUAGE;
  let resolved = requested;

  if (!highlighter.getLoadedLanguages().includes(requested)) {
    try {
      // Load bundled languages on demand (e.g. tsx, jsx, scss, php).
      await highlighter.loadLanguage(requested as BundledLanguage);
    } catch {
      // Unknown language: render the block as plain text instead of failing.
      resolved = FALLBACK_LANGUAGE;
    }
  }

  return highlighter.codeToHtml(code, {
    lang: resolved as BundledLanguage,
    themes: { light: 'github-light', dark: 'github-dark' },
  });
}
