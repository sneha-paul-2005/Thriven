import { useState, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { Button } from '../components/Button';
import { api, getToken } from '../services/api';

interface Message {
  type: 'user' | 'ai';
  message: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      message: 'Hi! I\'m Troy, your AI growth assistant. I can help you understand your metrics, identify opportunities, and answer questions about your data. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const data = await api.getDashboard(token);
        if (!data.detail) setMetrics(data);
      } catch (_) {}
    };
    fetchMetrics();
  }, []);

  const hasData = metrics?.has_data;
  const dau = hasData ? metrics.dau : '3,247';
  const mau = hasData ? metrics.mau : '28,450';
  const conversion = hasData ? `${metrics.conversion_rate}%` : '3.8%';

  const suggestedQuestions = [
    'Why is my retention dropping?',
    'Which traffic source converts best?',
    'How can I improve my funnel?',
    'What should I focus on this week?',
  ];

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setSending(true);

    try {
      const token = getToken();
      const history = messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.message }));
      const result = await api.sendChatMessage(token, userMessage, history);

      const aiResponse = result.reply || result.detail || 'Sorry, I ran into an issue answering that. Try again?';
      setMessages(prev => [...prev, { type: 'ai', message: aiResponse }]);
    } catch (_) {
      setMessages(prev => [...prev, { type: 'ai', message: 'Something went wrong reaching the assistant. Please try again.' }]);
    }
    setSending(false);
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Context Summary */}
      <div className="w-80 bg-card rounded-xl p-6 shadow-sm border border-border flex-shrink-0">
        <h3 className="text-xl font-semibold mb-4">Startup Context</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Key Metrics</p>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">DAU</span>
                <span className="text-sm font-medium">{dau}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">MAU</span>
                <span className="text-sm font-medium">{mau}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion</span>
                <span className="text-sm font-medium">{conversion}</span>
              </div>
            </div>
          </div>
          {!hasData && (
            <p className="text-xs text-muted-foreground">
              Showing sample data. Upload a CSV from the Dashboard for personalized answers.
            </p>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-card rounded-xl shadow-sm border border-border flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.map((msg, index) => (
            <ChatBubble key={index} type={msg.type} message={msg.message} />
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-1">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Thinking...
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground mb-3">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your growth metrics..."
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}