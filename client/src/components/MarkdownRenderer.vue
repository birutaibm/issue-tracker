<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { renderMarkdown } from './MarkdownRenderer/useMarkdown.js';

interface Props {
  markdown: string;
  projectSlug: string;
  cardSlug: string;
}

const props = defineProps<Props>();
const html = ref('');
const containerRef = ref<HTMLElement | null>(null);

async function enhanceWithContent(container: HTMLElement) {
  // Highlight code blocks with Shiki
  const { highlightCode } = await import('./MarkdownRenderer/useShiki.js');
  const codeBlocks = container.querySelectorAll('pre code[class*="language-"]');
  for (const block of codeBlocks) {
    const codeElement = block as HTMLElement;
    const className = codeElement.className;
    const langMatch = className.match(/language-([^\s]+)/);
    const lang = langMatch ? langMatch[1] : 'text';
    const code = codeElement.textContent || '';

    try {
      const highlighted = await highlightCode(code, lang);
      codeElement.parentElement!.outerHTML = highlighted;
    } catch (err) {
      console.error('Shiki highlighting failed:', err);
    }
  }

  // Render Mermaid diagrams
  const { renderMermaid } = await import('./MarkdownRenderer/useMermaid.js');
  await renderMermaid(container);
}

async function render() {
  if (!props.markdown.trim()) {
    html.value = '';
    return;
  }

  const rendered = await renderMarkdown(props.markdown, {
    projectSlug: props.projectSlug,
    cardSlug: props.cardSlug,
  });
  html.value = rendered;

  // Wait for DOM to update, then enhance with Shiki/Mermaid
  await nextTick();
  if (containerRef.value) {
    await enhanceWithContent(containerRef.value);
  }
}

onMounted(() => {
  render();
});

watch(
  () => props.markdown,
  () => {
    render();
  }
);

watch(
  () => [props.projectSlug, props.cardSlug],
  () => {
    render();
  }
);
</script>

<template>
  <div class="markdown-renderer" ref="containerRef" v-html="html"></div>
</template>

<style scoped>
.markdown-renderer {
  line-height: 1.7;
  color: #333;
  font-size: 0.95rem;
}

.markdown-renderer h1,
.markdown-renderer h2,
.markdown-renderer h3,
.markdown-renderer h4,
.markdown-renderer h5,
.markdown-renderer h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: #222;
}

.markdown-renderer h1 {
  font-size: 2rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.3em;
}
.markdown-renderer h2 {
  font-size: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.3em;
}
.markdown-renderer h3 {
  font-size: 1.25rem;
}
.markdown-renderer h4 {
  font-size: 1.1rem;
}

.markdown-renderer p {
  margin-top: 0;
  margin-bottom: 1em;
}

.markdown-renderer a {
  color: #42b883;
  text-decoration: none;
}
.markdown-renderer a:hover {
  text-decoration: underline;
}

.markdown-renderer ul,
.markdown-renderer ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0 1rem 0;
}

.markdown-renderer li {
  margin: 0.25rem 0;
}

.markdown-renderer code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  background: #f4f4f4;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
}

/* v-html content does not receive the scoped-style attribute, so code blocks
   need :deep() to get horizontal scrolling for long lines. */
.markdown-renderer :deep(pre) {
  margin: 1rem 0;
  border-radius: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  box-sizing: border-box;
  background: #2d2d2d;
}

.markdown-renderer pre code {
  background: none;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #f8f8f2;
}

.markdown-renderer pre code .line {
  display: block;
}

.markdown-renderer blockquote {
  border-left: 4px solid #42b883;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #666;
  font-style: italic;
}

.markdown-renderer table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.markdown-renderer th,
.markdown-renderer td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.markdown-renderer th {
  background: #f5f5f5;
  font-weight: 600;
}

.markdown-renderer tr:nth-child(even) td {
  background: #fafafa;
}

.markdown-renderer img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

.markdown-renderer hr {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 2rem 0;
}

.markdown-renderer .task-list-item {
  list-style: none;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.markdown-renderer .task-list-item-checkbox {
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.markdown-renderer .mermaid {
  text-align: center;
  margin: 1.5rem 0;
}

.markdown-renderer .mermaid svg {
  max-width: 100%;
}
</style>
