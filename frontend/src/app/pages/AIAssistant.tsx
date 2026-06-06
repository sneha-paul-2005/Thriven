import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { Button } from '../components/Button';

interface Message {
  type: 'user' | 'ai';
  message: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      message: 'Hi! I\'m your AI growth assistant. I can help you understand your metrics, identify opportunities, and answer questions about your data. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');

  const suggestedQuestions = [
    'Why is my retention dropping?',
    'Which traffic source converts best?',
    'How can I improve my funnel?',
    'What should I focus on this week?',
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');

    setMessages(prev => [...prev, { type: 'user', message: userMessage }]);

    setTimeout(() => {
      let aiResponse = '';

      if (userMessage.toLowerCase().includes('retention')) {
        aiResponse = 'Based on your cohort data, I see that Week 2 retention has dropped from 68% to 64% over the last month. The main cause appears to be lower engagement from users who signed up via paid ads compared to organic signups.\n\nI recommend:\n1. Add an onboarding email sequence for new users\n2. Implement push notifications for key features\n3. Create a "Week 2 win" milestone to celebrate with users';
      } else if (userMessage.toLowerCase().includes('traffic')) {
        aiResponse = 'Looking at your conversion data by traffic source:\n\nOrganic Search: 5.2% conversion (best performing)\nPaid Ads: 3.4% conversion\nSocial Media: 2.1% conversion\n\nOrganic traffic converts 53% better than paid ads. Consider investing more in SEO and content marketing to drive qualified organic traffic.';
      } else if (userMessage.toLowerCase().includes('funnel')) {
        aiResponse = 'Your biggest drop-off is between "Add to Cart" (6%) and "Purchase" (3%). This 50% drop suggests friction in your checkout process.\n\nQuick wins:\n1. Reduce checkout steps from 4 to 2\n2. Add guest checkout option\n3. Display security badges near payment form\n4. Enable one-click payment options\n\nThese changes typically improve conversion by 15-25%.';
      } else {
        aiResponse = 'Based on your current metrics, here are your top priorities:\n\n1. Fix the checkout funnel (highest impact)\n2. Improve Week 2 retention with better onboarding\n3. Scale organic traffic (your best-converting source)\n\nFocus on the checkout optimization first - it has the potential to increase revenue by 20%+ in the next 30 days.';
      }

      setMessages(prev => [...prev, { type: 'ai', message: aiResponse }]);
    }, 1000);
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
            <p className="text-sm text-muted-foreground mb-1">Industry</p>
            <p className="font-medium">E-commerce SaaS</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Stage</p>
            <p className="font-medium">Early Growth</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Key Metrics</p>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">DAU</span>
                <span className="text-sm font-medium">3,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">MAU</span>
                <span className="text-sm font-medium">28,450</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion</span>
                <span className="text-sm font-medium">3.8%</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Focus</p>
            <p className="font-medium">Improving conversion funnel</p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-card rounded-xl shadow-sm border border-border flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.map((msg, index) => (
            <ChatBubble key={index} type={msg.type} message={msg.message} />
          ))}
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
              className="flex-1 px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
