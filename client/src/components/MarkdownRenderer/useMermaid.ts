let initialized = false;

export function initMermaid(): Promise<void> {
  if (!initialized) {
    return import('mermaid').then((mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });
      initialized = true;
    });
  }
  return Promise.resolve();
}

export async function renderMermaid(container: HTMLElement): Promise<void> {
  await initMermaid();
  const mermaid = (await import('mermaid')).default;
  const elements = container.querySelectorAll('.mermaid:not([data-processed])');
  console.log('[renderMermaid] Mermaid elements found:', elements.length);

  for (const el of elements) {
    el.setAttribute('data-processed', 'true');
  }

  if (elements.length > 0) {
    try {
      // Ensure elements are visible and have content
      for (const el of elements) {
        el.style.display = 'block';
        el.style.visibility = 'visible';
        // Ensure the element has the mermaid content
        if (!el.textContent || el.textContent.trim() === '') {
          console.log('[renderMermaid] Empty mermaid element, skipping');
          continue;
        }
      }

      // Wait for DOM to settle
      await new Promise((r) => setTimeout(r, 200));

      await mermaid.run({ nodes: Array.from(elements) });
      console.log('[renderMermaid] Mermaid rendering completed');
    } catch (err) {
      console.error('Mermaid rendering failed:', err);
    }
  }
}
