import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Volume2,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { aiService } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actions?: string[];
  timestamp: Date;
}

export const AIAssistantPage: React.FC = () => {
  const { currentProfile } = useProfile();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello! I am your CareCircle AI Care Assistant. I have live access to ${
        currentProfile?.full_name || 'your'
      }'s medication schedules, doctor appointments, and recorded vitals. How can I assist you today?`,
      actions: [
        'What medicine do I take next?',
        'When is my next doctor appointment?',
        'Summarize recent vitals',
        'Generate 14-Day AI Care Digest'
      ],
      timestamp: new Date()
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<any | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(false);

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || !currentProfile) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    // If query asks for digest
    if (q.toLowerCase().includes('digest') || q.toLowerCase().includes('weekly summary')) {
      await generateDigest();
      setLoading(false);
      return;
    }

    try {
      const res = await aiService.query(currentProfile.id, q);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.answer,
        actions: res.suggested_actions,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'I encountered an error connecting to clinical records. Please try again.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const generateDigest = async () => {
    if (!currentProfile) return;
    setLoadingDigest(true);
    try {
      const summary = await aiService.getWeeklySummary(currentProfile.id);
      setDigest(summary);
      const aiMsg: Message = {
        id: `ai-digest-${Date.now()}`,
        sender: 'ai',
        text: `I have compiled the 14-Day Executive AI Care Digest for ${summary.patient_name}. Review the detailed clinical brief below!`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDigest(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Clean markdown asterisks for speech
      const cleaned = text.replace(/[*_#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported by your browser.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-teal-300" />
            Catalyst AI Healthcare Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">CareCircle AI Assistant</h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-xl">
            Voice and text care companion for {currentProfile?.full_name}. Real-time schedule guidance, medication info, and 14-day clinical summaries.
          </p>
        </div>

        <button
          onClick={generateDigest}
          disabled={loadingDigest}
          className="px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <FileText className="w-4 h-4 text-teal-700" />
          <span>{loadingDigest ? 'Analyzing Records...' : 'Generate 14-Day AI Care Digest'}</span>
        </button>
      </div>

      {/* Main Conversation Window */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col h-[520px]">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                    isUser ? 'bg-sky-600' : 'bg-teal-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Actions & Speech Button */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => speakText(m.text)}
                        title="Read answer aloud"
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Read Aloud</span>
                      </button>

                      <span className="text-[10px] text-slate-400">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Quick suggested action pills */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(act)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200 transition"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing clinical database records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about medicines, doses, appointments, or vitals..."
            className="flex-1 text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Generated 14-Day AI Care Digest Presentation */}
      {digest && (
        <div className="bg-white border-2 border-teal-500/40 rounded-3xl p-6 sm:p-8 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">14-Day Clinical AI Care Digest</h2>
                <p className="text-xs text-slate-500">
                  Patient: <strong className="text-slate-800">{digest.patient_name}</strong> • Generated{' '}
                  {new Date(digest.generated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 font-bold text-xs">
              Adherence: {digest.adherence_rate}%
            </span>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl">
              <span className="font-bold uppercase tracking-wider text-[11px] text-teal-800 block mb-1">
                Executive Status Assessment
              </span>
              <p className="text-slate-800 leading-relaxed">{digest.executive_summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 block mb-1">
                  Medication Adherence Breakdown
                </span>
                <p className="text-slate-700">{digest.medication_status}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 block mb-1">
                  Cardiovascular & Vitals Review
                </span>
                <p className="text-slate-700">{digest.vitals_assessment}</p>
              </div>
            </div>

            <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl">
              <span className="font-bold uppercase tracking-wider text-[11px] text-sky-800 block mb-1">
                Upcoming Medical Consultations
              </span>
              <p className="text-slate-800">{digest.upcoming_events_notice}</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 block mb-2">
                AI Clinical Recommendations for Care Circle
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {digest.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
