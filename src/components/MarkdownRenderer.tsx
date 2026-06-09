import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Info, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { extractText, cleanMarkdown } from '../utils/markdownUtils';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const MarkdownComponents = {
    blockquote: ({ children }: any) => {
      const textVal = extractText(children);

      let icon = <Info size={20} />;
      let className = 'info';

      if (textVal.includes('[KRITIS]')) {
        icon = <AlertCircle size={20} color="#ef4444" />;
        className = 'kritis';
      } else if (textVal.includes('[PERINGATAN]')) {
        icon = <AlertTriangle size={20} color="#f59e0b" />;
        className = 'peringatan';
      } else if (textVal.includes('[SARAN]')) {
        icon = <CheckCircle2 size={20} color="#10b981" />;
        className = 'saran';
      }

      return (
        <blockquote className={className} style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          borderLeftWidth: '6px',
          borderLeftStyle: 'solid',
          padding: '1.25rem 1.5rem',
          margin: '1.5rem 0',
          borderRadius: '8px',
          color: 'inherit'
        }}>
          <div style={{ marginTop: '0.2rem', flexShrink: 0 }}>{icon}</div>
          <div style={{ flex: 1 }}>{children}</div>
        </blockquote>
      );
    }
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={MarkdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {cleanMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
