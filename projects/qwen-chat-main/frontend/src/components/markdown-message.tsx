'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SearchSource {
  id: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

interface MarkdownMessageProps {
  content: string;
  className?: string;
  sources?: SearchSource[];
}

export function MarkdownMessage({ content, className = '', sources }: MarkdownMessageProps) {
  // Custom text renderer to handle citations
  const TextRenderer = ({ children }: { children: string }) => {
    if (!sources || sources.length === 0 || typeof children !== 'string') {
      return <>{children}</>;
    }

    // Split text by citation pattern [1], [2], etc.
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    const citationRegex = /\[(\d+)\]/g;
    let match;

    while ((match = citationRegex.exec(children)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(children.substring(lastIndex, match.index));
      }

      // Add citation as styled link
      const sourceNum = parseInt(match[1], 10);
      const source = sources.find(s => s.id === sourceNum);

      if (source) {
        parts.push(
          <a
            key={`cite-${match.index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center align-super text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mx-0.5"
            title={source.title}
          >
            [{sourceNum}]
          </a>
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < children.length) {
      parts.push(children.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Custom text renderer for citations
        text: TextRenderer as any,
        // Links - make them open in new tab and style them
        a: ({ node, ...props }: any) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          />
        ),
        // Images - make them responsive and rounded
        img: ({ node, ...props }: any) => (
          <img
            {...props}
            className="rounded-lg max-w-full h-auto my-2 shadow-md"
            loading="lazy"
          />
        ),
        // Code blocks - better styling
        code: ({ node, inline, ...props }: any) =>
          inline ? (
            <code
              {...props}
              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
            />
          ) : (
            <code
              {...props}
              className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-sm font-mono"
            />
          ),
        // Pre blocks - remove default styling
        pre: ({ node, ...props }: any) => (
          <pre {...props} className="my-2" />
        ),
        // Paragraphs - add spacing
        p: ({ node, ...props }: any) => (
          <p {...props} className="mb-2 last:mb-0" />
        ),
        // Lists - better spacing
        ul: ({ node, ...props }: any) => (
          <ul {...props} className="list-disc list-inside mb-2 space-y-1" />
        ),
        ol: ({ node, ...props }: any) => (
          <ol {...props} className="list-decimal list-inside mb-2 space-y-1" />
        ),
        // Tables - responsive and styled
        table: ({ node, ...props }: any) => (
          <div className="overflow-x-auto my-2">
            <table
              {...props}
              className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg"
            />
          </div>
        ),
        thead: ({ node, ...props }: any) => (
          <thead {...props} className="bg-gray-50 dark:bg-gray-800" />
        ),
        th: ({ node, ...props }: any) => (
          <th
            {...props}
            className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          />
        ),
        td: ({ node, ...props }: any) => (
          <td
            {...props}
            className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700"
          />
        ),
        // Blockquotes - styled
        blockquote: ({ node, ...props }: any) => (
          <blockquote
            {...props}
            className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2 text-gray-700 dark:text-gray-300"
          />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
