interface ChatBubbleProps {
  type: 'user' | 'ai';
  message: string;
}

export function ChatBubble({ type, message }: ChatBubbleProps) {
  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-xl p-4 ${
          type === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground shadow-sm border border-border'
        }`}
      >
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}
