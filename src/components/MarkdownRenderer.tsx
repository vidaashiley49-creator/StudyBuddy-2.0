import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Helper to safely render simple markdown and math equations
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const flushList = () => {
      if (currentList) {
        if (currentList.type === 'ul') {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1.5 my-2.5 text-slate-700 dark:text-slate-300">
              {currentList.items.map((it, i) => (
                <li key={i} className="leading-relaxed">
                  {formatInline(it)}
                </li>
              ))}
            </ul>
          );
        } else {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-2.5 text-slate-700 dark:text-slate-300">
              {currentList.items.map((it, i) => (
                <li key={i} className="leading-relaxed">
                  {formatInline(it)}
                </li>
              ))}
            </ol>
          );
        }
        currentList = null;
      }
    };

    const formatInline = (str: string): React.ReactNode[] => {
      // Handle block math $$...$$
      // Handle inline math $...$
      // Handle bold **...**
      // Handle code `...`
      const tokens: React.ReactNode[] = [];
      let remaining = str;
      let keyIdx = 0;

      while (remaining.length > 0) {
        // Block math $$...$$
        const blockMathMatch = remaining.match(/^\$\$([^\$]+)\$\$/);
        if (blockMathMatch) {
          tokens.push(
            <span
              key={keyIdx++}
              className="my-2 block py-1.5 px-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg font-mono text-center text-indigo-700 dark:text-indigo-300 font-semibold overflow-x-auto text-sm sm:text-base"
            >
              {blockMathMatch[1].trim()}
            </span>
          );
          remaining = remaining.slice(blockMathMatch[0].length);
          continue;
        }

        // Inline math $...$
        const inlineMathMatch = remaining.match(/^\$([^\$]+)\$/);
        if (inlineMathMatch) {
          tokens.push(
            <span
              key={keyIdx++}
              className="inline-block px-1.5 py-0.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded text-indigo-700 dark:text-indigo-300 font-mono font-medium text-xs sm:text-sm mx-0.5"
            >
              {inlineMathMatch[1].trim()}
            </span>
          );
          remaining = remaining.slice(inlineMathMatch[0].length);
          continue;
        }

        // Code `...`
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
          tokens.push(
            <code
              key={keyIdx++}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-pink-600 dark:text-pink-400 font-mono text-xs sm:text-sm"
            >
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        // Bold **...**
        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
          tokens.push(
            <strong key={keyIdx++} className="font-bold text-slate-900 dark:text-white">
              {boldMatch[1]}
            </strong>
          );
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        // Italic *...*
        const italicMatch = remaining.match(/^\*([^*]+)\*/);
        if (italicMatch) {
          tokens.push(
            <em key={keyIdx++} className="italic text-slate-800 dark:text-slate-200">
              {italicMatch[1]}
            </em>
          );
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        // Plain char
        const nextSpecial = remaining.search(/[\$`\*]/);
        if (nextSpecial === -1) {
          tokens.push(remaining);
          break;
        } else if (nextSpecial === 0) {
          tokens.push(remaining[0]);
          remaining = remaining.slice(1);
        } else {
          tokens.push(remaining.slice(0, nextSpecial));
          remaining = remaining.slice(nextSpecial);
        }
      }

      return tokens;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code fence
      if (line.trim().startsWith('```')) {
        flushList();
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${elements.length}`}
              className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto my-3 border border-slate-800 shadow-sm"
            >
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Empty line
      if (!line.trim()) {
        flushList();
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">
            {formatInline(line.replace('### ', ''))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-5 mb-2.5">
            {formatInline(line.replace('## ', ''))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-6 mb-3">
            {formatInline(line.replace('# ', ''))}
          </h1>
        );
        continue;
      }

      // Bullet lists
      if (/^\s*[-*•]\s+/.test(line)) {
        const itemText = line.replace(/^\s*[-*•]\s+/, '');
        if (!currentList || currentList.type !== 'ul') {
          flushList();
          currentList = { type: 'ul', items: [itemText] };
        } else {
          currentList.items.push(itemText);
        }
        continue;
      }

      // Numbered lists
      if (/^\s*\d+[\.\)]\s+/.test(line)) {
        const itemText = line.replace(/^\s*\d+[\.\)]\s+/, '');
        if (!currentList || currentList.type !== 'ol') {
          flushList();
          currentList = { type: 'ol', items: [itemText] };
        } else {
          currentList.items.push(itemText);
        }
        continue;
      }

      // Blockquotes
      if (line.startsWith('>')) {
        flushList();
        elements.push(
          <blockquote
            key={`bq-${elements.length}`}
            className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 py-2 px-3.5 rounded-r-lg my-2.5 italic text-slate-700 dark:text-slate-300 text-sm"
          >
            {formatInline(line.replace(/^>\s*/, ''))}
          </blockquote>
        );
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="text-slate-700 dark:text-slate-300 leading-relaxed my-2 text-sm sm:text-base">
          {formatInline(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  return <div className={`space-y-1 ${className}`}>{renderFormattedText(content)}</div>;
};
