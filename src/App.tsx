/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Newspaper, 
  Activity, 
  Search, 
  Send, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
  User,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSportsNews, getLiveScores, getPlayerStats, chatWithAnalyst } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'news' | 'scores' | 'players' | 'chat';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('news');
  const [news, setNews] = useState<string>('');
  const [scores, setScores] = useState<string>('');
  const [playerQuery, setPlayerQuery] = useState('');
  const [playerStats, setPlayerStats] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [newsData, scoresData] = await Promise.all([
        getSportsNews(),
        getLiveScores()
      ]);
      setNews(newsData);
      setScores(scoresData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerQuery.trim()) return;
    setLoading(true);
    try {
      const stats = await getPlayerStats(playerQuery);
      setPlayerStats(stats);
    } catch (error) {
      console.error("Error searching player:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg: Message = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const stream = await chatWithAnalyst(chatInput, history);
      let fullText = '';
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        fullText += chunk.text;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullText;
          return newMsgs;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const tabs = [
    { id: 'news', label: 'News Feed', icon: Newspaper },
    { id: 'scores', label: 'Live Scores', icon: Trophy },
    { id: 'players', label: 'Player Stats', icon: User },
    { id: 'chat', label: 'AI Analyst', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col data-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-dark/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SportPulse <span className="text-brand-primary">AI</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Real-time Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchInitialData}
              disabled={loading}
              className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5 text-zinc-400", loading && "animate-spin")} />
            </button>
            <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              <span className="text-xs font-medium text-zinc-400">Live Data Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="md:w-64 flex-shrink-0">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  activeTab === tab.id 
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight className="ml-auto w-4 h-4" />}
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 glass-panel border-brand-primary/20">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Trending Topics</h3>
            <ul className="space-y-2">
              {['Champions League', 'NBA Playoffs', 'F1 Season', 'NFL Draft'].map(topic => (
                <li key={topic} className="flex items-center gap-2 text-sm text-zinc-300 hover:text-brand-primary cursor-pointer transition-colors">
                  <TrendingUp className="w-3 h-3" />
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'news' && (
              <motion.div
                key="news"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Latest Headlines</h2>
                  <span className="text-xs font-mono text-zinc-500">Updated: {new Date().toLocaleTimeString()}</span>
                </div>
                
                {loading && !news ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4 glass-panel">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                    <p className="text-zinc-500 animate-pulse">Scanning global sports networks...</p>
                  </div>
                ) : (
                  <div className="glass-panel p-6 md:p-8">
                    <div className="markdown-body">
                      <Markdown>{news}</Markdown>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'scores' && (
              <motion.div
                key="scores"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Scoreboard</h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <Calendar className="w-3 h-3" />
                    {new Date().toLocaleDateString()}
                  </div>
                </div>

                {loading && !scores ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4 glass-panel">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                    <p className="text-zinc-500 animate-pulse">Fetching live match data...</p>
                  </div>
                ) : (
                  <div className="glass-panel p-6 md:p-8">
                    <div className="markdown-body">
                      <Markdown>{scores}</Markdown>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'players' && (
              <motion.div
                key="players"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">Player Statistics</h2>
                
                <form onSubmit={handlePlayerSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input
                    type="text"
                    value={playerQuery}
                    onChange={(e) => setPlayerQuery(e.target.value)}
                    placeholder="Search for any athlete (e.g. LeBron James, Kylian Mbappé)..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={loading || !playerQuery.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-50 transition-all"
                  >
                    Analyze
                  </button>
                </form>

                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4 glass-panel">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                    <p className="text-zinc-500 animate-pulse">Retrieving player database...</p>
                  </div>
                ) : playerStats ? (
                  <div className="glass-panel p-6 md:p-8">
                    <div className="markdown-body">
                      <Markdown>{playerStats}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center gap-4 glass-panel text-center px-8">
                    <User className="w-12 h-12 text-zinc-700" />
                    <div>
                      <h3 className="text-lg font-bold text-zinc-400">No Player Selected</h3>
                      <p className="text-zinc-500 text-sm">Enter an athlete's name above to see their current season stats and analysis.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[calc(100vh-12rem)] flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">AI Sports Analyst</h2>
                  <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-full font-mono">Gemini 3 Flash</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scrollbar-thumb-white/10">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-8 text-zinc-500">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                      <p className="max-w-xs">Ask me anything about sports history, strategy, or current events. I have real-time access to the latest data.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl text-sm",
                          msg.role === 'user' 
                            ? "bg-brand-primary text-white rounded-tr-none" 
                            : "glass-panel rounded-tl-none border-white/5"
                        )}
                      >
                        {msg.role === 'model' ? (
                          <div className="markdown-body text-sm">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">
                        {msg.role === 'user' ? 'You' : 'SportPulse AI'}
                      </span>
                    </div>
                  ))}
                  {isChatting && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyst is thinking...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about sports..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 disabled:opacity-50 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-xs">
            © {new Date().getFullYear()} SportPulse AI. Powered by Google Gemini.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-500 hover:text-white text-xs transition-colors">Privacy</a>
            <a href="#" className="text-zinc-500 hover:text-white text-xs transition-colors">Terms</a>
            <a href="#" className="text-zinc-500 hover:text-white text-xs transition-colors">API Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
