import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface TutorChatProps {
  wireLength: number;
  resistance: string;
  avgCollisions: number;
}

export default function TutorChat({ wireLength, resistance, avgCollisions }: TutorChatProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your AI tutor. Before we play with the slider, what do you think happens to an electron as it travels through a wire? Does it fly straight through like water in an empty pipe, or something else?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const systemInstruction = `You are an AI tutor for City & Guilds 2365 Level 2 Electrical Installation learners. 
You are guiding them through a simulation showing how wire length affects electrical resistance.

Current simulation state:
- Wire Length Multiplier: ${wireLength.toFixed(1)}x
- Total Resistance: ${resistance} Ω
- Average Collisions per Electron: ${avgCollisions > 0 ? Math.round(avgCollisions) : 'N/A'}

CORE MISCONCEPTION TO ADDRESS:
Learners often think electricity flows through a wire like water through an empty pipe. They don't realize electrons physically collide with metal atoms, and that a longer wire simply means *more atoms to hit*, causing more collisions and higher resistance.

YOUR TUTORING LOOP:
1. Predict: Ask what they think happens or will happen.
2. Try / Observe: Ask them to change the wire length and observe the collisions and resistance.
3. What changed?: Ask them what they saw.
4. Why?: Ask them to explain why it changed based on the atoms and electrons.
5. Refute & Correct: Briefly correct any wrong ideas using the visual evidence.
6. Transfer: Ask one final check question.

RULES:
- Keep prompts short, clear, and plain-English.
- Teach one idea at a time.
- Do NOT give long lectures or give the answer immediately.
- Ground everything in the visible app state (cyan electrons, red metal atoms, amber collisions, length slider).
- Set isComplete to true ONLY when the learner has demonstrated a clear understanding that a longer wire has more resistance because the electrons have to travel past more atoms, resulting in more collisions.`;

      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: userMsg }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              feedback: {
                type: Type.STRING,
                description: "Your short, conversational response to the user."
              },
              isComplete: {
                type: Type.BOOLEAN,
                description: "True if the user has demonstrated full understanding of the core concept."
              }
            },
            required: ["feedback", "isComplete"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        setMessages(prev => [...prev, { role: 'model', text: parsed.feedback }]);
        if (parsed.isComplete) {
          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to my brain. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="text-cyan-400" size={20} />
          <h3 className="font-medium text-white">AI Tutor</h3>
          {isComplete && (
            <span className="bg-green-500/20 text-green-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ml-2 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700 text-slate-300' : 'bg-cyan-500/20 text-cyan-400'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-200 rounded-tl-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-cyan-400" />
              <span className="text-xs text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-800 border-t border-slate-700 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Reply to tutor..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 p-2 rounded-xl transition-colors flex items-center justify-center shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
