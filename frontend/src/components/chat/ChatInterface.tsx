import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Image as ImageIcon, Volume2, X, RefreshCw } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { useAccessibility } from '../../core/contexts/AccessibilityContext';
import { useExplain } from '../../core/hooks/useExplain';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export const ChatInterface: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hello! I am Sahayak AI. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { language } = useAccessibility();
  const explain = useExplain();

  // Speech to Text setup
  const recognition = useRef<any>(null);
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      
      recognition.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + text);
        setIsListening(false);
      };
      
      recognition.current.onerror = () => setIsListening(false);
      recognition.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      if (language === 'hi') recognition.current.lang = 'hi-IN';
      else if (language === 'bn') recognition.current.lang = 'bn-IN';
      else recognition.current.lang = 'en-US';
      
      recognition.current?.start();
      setIsListening(true);
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'bn') utterance.lang = 'bn-IN';
    else utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // OCR Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/tools/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.extracted_text) {
        setInput(prev => prev + '\n' + data.extracted_text);
      }
    } catch (error) {
      console.error('OCR Error', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Chat Send
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Activity Log
    try {
      await fetch('http://127.0.0.1:8000/api/v1/activity/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CHAT_MESSAGE', details: 'Sent a message to Sahayak AI' })
      });
    } catch (e) {}

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      let aiMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '' }]);

      let buffer = '';
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]') && !line.includes('{"session_id"')) {
            aiText += line.replace('data: ', '').replace(/\r/g, '');
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiText } : m));
          }
        }
      }

      // Automatically translate if language is not EN
      if (language !== 'en') {
        const tRes = await fetch('http://127.0.0.1:8000/api/v1/tools/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiText, target_language: language === 'hi' ? 'Hindi' : 'Bengali' })
        });
        const tData = await tRes.json();
        if (tData.translated_text) {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: tData.translated_text } : m));
        }
      }

    } catch (error) {
      console.error('Chat Error', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] z-50 flex flex-col h-[600px] max-h-[80vh]">
      <GlassCard className="flex-1 flex flex-col !p-0 overflow-hidden shadow-2xl border-4 border-[#2E7D32]">
        {/* Header */}
        <div className="bg-[#2E7D32] text-white p-4 flex items-center justify-between">
          <h2 className="font-bold text-xl">Sahayak Assistant</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#1B5E20] rounded-full transition-colors" onMouseEnter={() => explain("Close chat")}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-[#2E7D32] text-white rounded-br-none' : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                <p className="text-lg leading-relaxed">{msg.text}</p>
                {msg.sender === 'ai' && (
                  <button 
                    onClick={() => speakText(msg.text)}
                    className="mt-2 text-gray-500 hover:text-[#2E7D32] focus:outline-none"
                    onMouseEnter={() => explain("Read out loud")}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center">
                <RefreshCw className="w-5 h-5 animate-spin text-[#2E7D32] mr-2" />
                <span className="text-gray-500">Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t-2 border-gray-200">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 hover:text-[#2E7D32] hover:bg-gray-100 rounded-full transition-colors focus:ring-4 focus:ring-[#2E7D32]"
              title="Upload Image for OCR"
              onMouseEnter={() => explain("Upload Image for Text Extraction")}
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-gray-100 border-2 border-transparent focus:border-[#2E7D32] rounded-xl px-4 py-3 text-lg focus:outline-none focus:bg-white transition-colors"
              placeholder="Type your message..."
            />

            <button 
              onClick={toggleListening}
              className={`p-3 rounded-full transition-colors focus:ring-4 focus:ring-[#2E7D32] ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-gray-500 hover:text-[#2E7D32] hover:bg-gray-100'}`}
              onMouseEnter={() => explain(isListening ? "Stop listening" : "Start voice typing")}
            >
              <Mic className="w-6 h-6" />
            </button>

            <button 
              onClick={sendMessage}
              disabled={!input.trim() || isProcessing}
              className="p-3 bg-[#2E7D32] text-white rounded-full hover:bg-[#1B5E20] transition-colors focus:ring-4 focus:ring-offset-2 focus:ring-[#2E7D32] disabled:opacity-50"
              onMouseEnter={() => explain("Send message")}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
