import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isTyping?: boolean;
}

const MarkdownRenderer = ({ content, className = '', isTyping = false }: MarkdownRendererProps) => {
  return (
    <div className={`markdown-content ${className} ${isTyping ? 'typing-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Remove images from rendered content
          img: () => null,
          h1: ({ children }) => (
            <h1 className="mb-6 mt-8 text-2xl font-bold text-primary first:mt-0 pb-3 border-b-2 border-primary/30">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 text-xl font-bold text-foreground bg-secondary/30 rounded-lg px-4 py-2 border-l-4 border-primary">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 text-base font-semibold text-foreground/90">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground/90 text-base">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-5 ml-6 space-y-2 text-foreground/90 list-disc">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 ml-6 space-y-2 text-foreground/90 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-primary">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-primary bg-primary/5 rounded-r-lg py-4 px-5 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded-md bg-secondary px-2 py-1 text-sm font-mono text-primary">
              {children}
            </code>
          ),
          hr: () => (
            <hr className="my-8 border-border/30" />
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-lg border border-border -mx-1">
              <table className="w-full text-sm border-collapse min-w-[600px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-secondary/50 border-b-2 border-border">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 last:border-r-0 whitespace-nowrap">
              {children}
            </th>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border/30 last:border-b-0 even:bg-secondary/20">
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-r border-border/30 last:border-r-0 align-top">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
