import ReactMarkdown from 'react-markdown';

interface ChatBubbleProps {
  type: 'user' | 'ai';
  message: string;
}

export function ChatBubble({ type, message }: ChatBubbleProps) {
  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] min-w-0 rounded-xl p-4 ${
          type === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground shadow-sm border border-border'
        }`}
      >
        {type === 'user' ? (
          <p className="whitespace-pre-wrap break-words">{message}</p>
        ) : (
          <div className="break-words space-y-3">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h3 className="text-lg font-semibold mt-1">{children}</h3>,
                h2: ({ children }) => <h3 className="text-lg font-semibold mt-1">{children}</h3>,
                h3: ({ children }) => <h4 className="text-base font-semibold mt-2">{children}</h4>,
                h4: ({ children }) => <h4 className="text-base font-semibold mt-2">{children}</h4>,
                p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-sm">{children}</code>
                ),
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}