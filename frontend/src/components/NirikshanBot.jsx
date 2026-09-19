import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function NirikshanBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const location = useLocation();
  const recognitionRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        // Automatically submit the voice query
        processQuery(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a good English voice (preferably female/assistant-like)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en')) || 
                             voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Define context-aware intelligence for the first message
  const getContextMessage = (path) => {
    if (path.includes('/app/mp')) {
      return "Hello! I've scanned this MP's portfolio. I detected 3 delayed projects and 1 potential duplicate scheme. Would you like me to draft an escalation report or break down the highest risk factors?";
    } else if (path.includes('/app/ministry')) {
      return "Ministry Dashboard loaded. National utilization is currently below expected thresholds. Uttar Pradesh shows the highest concentration of stalled works. Shall I generate a heat map analysis for you?";
    } else if (path.includes('/app/agency')) {
      return "Agency profile detected. Your Trust Score is currently 78/100. Submitting progress photos for your delayed rural road project could improve this by 5 points. Ready to upload?";
    } else if (path.includes('/app/alerts')) {
      return "Alert Center active. I have automatically prioritized 12 High Risk alerts using the Z-Score engine. Would you like me to auto-assign field officers to inspect the top 3?";
    } else if (path.includes('/app/nexus')) {
      return "Nexus Graph online. I have traversed the relationships and identified a suspicious clustering pattern where 85% of contracts in District 4 were awarded to a single holding company. Investigate node?";
    } else {
      return "Greetings from Nirikshan AI! I am your intelligent assistant. I continuously monitor 774 MPs and thousands of projects in real-time. How can I assist your oversight today?";
    }
  };

  const initialMessage = getContextMessage(location.pathname);

  // Set initial message on load or route change
  useEffect(() => {
    setChatHistory([{ sender: 'bot', text: initialMessage }]);
  }, [location.pathname]);

  const processQuery = (queryText) => {
    if (!queryText.trim()) return;

    // Add user message
    const newUserMsg = { sender: 'user', text: queryText };
    setChatHistory(prev => [...prev, newUserMsg]);
    setInputValue('');

    // Simulate AI thinking delay
    setTimeout(() => {
      let botResponse = "Processing your request through Nirikshan AI... I have logged this query for the nodal officer.";
      const lowerInput = queryText.toLowerCase();
      
      if (lowerInput.includes('risk') || lowerInput.includes('highest')) {
        botResponse = "Based on my real-time Z-Score analysis, Maharashtra currently holds the highest concentration of high-risk projects. Would you like me to filter the dashboard?";
      } else if (lowerInput.includes('duplicate') || lowerInput.includes('ghost')) {
        botResponse = "My NLP and GPS engines have flagged 14 potential duplicate schemes. They share a 75% confidence overlap. I have pushed them to the Alert Center.";
      } else if (lowerInput.includes('lapse') || lowerInput.includes('forecast')) {
        botResponse = "My Linear Regression model predicts 45.2 Crores will lapse nationally by year-end if disbursement velocity doesn't improve by 15 percent.";
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        botResponse = "Hello! How can I assist you with project monitoring today?";
      }

      setChatHistory(prev => [...prev, { sender: 'bot', text: botResponse }]);
      
      // Speak the response out loud
      speakResponse(botResponse);
    }, 600); // Simulated delay
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    processQuery(inputValue);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      <div 
        className={`pointer-events-auto transition-all duration-500 origin-bottom-right transform 
          ${isOpen ? 'scale-100 opacity-100 mb-4' : 'scale-0 opacity-0 h-0 mb-0'} 
          w-80 bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.15)] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white font-bold text-sm tracking-wider">NIRIKSHAN VOICE AI</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Chat Body */}
        <div className="p-4 h-56 overflow-y-auto flex flex-col space-y-3" ref={chatBodyRef}>
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="text-2xl">🤖</div>
              <p className="text-slate-400 text-xs text-center">Hi! I'm Nirikshan AI.<br/>Ask me anything about MPLAD funds.</p>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start space-x-2'}`}>
              {msg.sender === 'bot' && (
                <div className="flex-shrink-0 w-6 h-6 mt-1 rounded-full overflow-hidden border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                  <img src="/assets/bot-avatar.jpg" alt="Bot" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`p-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-orange-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        {/* Suggestion Chips — shown only before first message */}
        {chatHistory.length === 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {[
              '🚨 Show high risk projects',
              '💰 Which MP has lowest fund utilization?',
              '🔍 Any stalled projects?',
              '🏗️ Top performing agencies?',
              '🕸️ Show nexus alerts',
              '📊 Overall fund summary',
            ].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => processQuery(q)}
                className="text-xs px-2.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/25 hover:border-orange-500/60 transition-all cursor-pointer whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700/50 bg-slate-900/50">
          <div className="bg-slate-800 rounded-full flex items-center px-4 py-2 border border-slate-700 relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Nirikshan AI..." 
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-500 pr-12"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {/* Voice Button */}
              <button 
                type="button" 
                onClick={toggleListen}
                className={`p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Voice Command"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Send Button */}
              <button type="submit" className="text-orange-500 p-1.5 hover:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Floating Orb Avatar */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative group flex items-center justify-center w-16 h-16 rounded-full focus:outline-none focus:ring-4 focus:ring-orange-500/50 transition-transform duration-300 hover:scale-110"
      >
        {/* Pulsing ring behind */}
        <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-400 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* The Avatar Image */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-orange-200/50 shadow-[0_0_20px_rgba(249,115,22,0.8)] z-10">
          <img 
            src="/assets/bot-avatar.jpg" 
            alt="Nirikshan AI Assistant" 
            className="w-full h-full object-cover mix-blend-screen"
          />
        </div>
        
        {/* Unread dot */}
        {!isOpen && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-slate-900 rounded-full z-20" />
        )}
      </button>

    </div>
  );
}
