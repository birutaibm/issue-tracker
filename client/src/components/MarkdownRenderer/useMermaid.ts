import type { Mermaid } from 'mermaid';

let initialized = false;
let mermaidApi: Mermaid | null = null;

async function getMermaid(): Promise<Mermaid> {
  if (!mermaidApi) {
    mermaidApi = (await import('mermaid')).default;
  }
  return mermaidApi;
}

export async function initMermaid(): Promise<void> {
  if (initialized) return;

  const mermaid = await getMermaid();
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
  });
  initialized = true;
}

export async function renderMermaid(container: HTMLElement): Promise<void> {
  // Elements are marked with `data-processed` by mermaid itself, so only select
  // the ones that have not been rendered yet.
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>('.mermaid:not([data-processed])')
  );

  if (elements.length === 0) return;

  await initMermaid();
  const mermaid = await getMermaid();

  try {
    await mermaid.run({ nodes: elements });
  } catch (err) {
    console.error('Mermaid rendering failed:', err);
  }
}
