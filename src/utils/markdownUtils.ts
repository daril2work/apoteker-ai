/**
 * Recursively extracts raw text from a React node structure.
 */
export const extractText = (node: any): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (node?.props?.children) return extractText(node.children || node.props.children);
  return '';
};

/**
 * Cleans markdown code block wraps (like ```markdown and ```) from the AI response string.
 */
export const cleanMarkdown = (text: string | null): string => {
  if (!text) return "";
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```+(markdown|text)?\s*/i, '').replace(/\s*```+$/i, '');
  cleaned = cleaned.replace(/^`+/, '').replace(/`+$/, '');
  return cleaned.trim();
};
