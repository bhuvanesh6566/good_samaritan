import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, Send, ShieldCheck, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';

const INITIAL_QUESTIONS = [
  "Is the victim breathing?",
  "Is there heavy bleeding?",
  "Is the victim conscious and responding?",
  "Is the victim trapped in the vehicle?",
  "Is the victim's neck or spine possibly injured?"
];

export default function AIVoiceGuide({ emergencyId }) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamBuffer, currentQIndex]);

  // ── Text-To-Speech (TTS) ──────────────────────────────────
  const speakText = useCallback((text) => {
    if (!voiceEnabled || !synthRef.current) return;
    try {
      synthRef.current.cancel(); // stop current utterance
      // Strip markdown asterisks and hashtags for natural speech
      const plainText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN'; // Indian English if available, falls back to default

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }, [voiceEnabled]);

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Speak initial question when question changes
  useEffect(() => {
    if (currentQIndex < INITIAL_QUESTIONS.length && chatHistory.length === 0) {
      const firstQ = INITIAL_QUESTIONS[0];
      speakText(firstQ);
    }
  }, [speakText, currentQIndex, chatHistory.length]);

  // ── Speech-To-Text (STT) ──────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log('Voice recognized:', transcript);
        if (currentQIndex < INITIAL_QUESTIONS.length) {
          // Normalize recognized answer for structured questionnaire
          const lower = transcript.toLowerCase();
          if (lower.includes('yes') || lower.includes('yeah') || lower.includes('yup') || lower.includes('breathing') || lower.includes('heavy') || lower.includes('conscious') || lower.includes('trapped')) {
            handleAnswer('Yes');
          } else if (lower.includes('no') || lower.includes('nope') || lower.includes('not')) {
            handleAnswer('No');
          } else {
            handleAnswer(transcript);
          }
        } else {
          // Send conversational query
          setCustomInput(transcript);
          handleCustomSubmit(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [currentQIndex]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        stopSpeaking();
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // ── Handle structured question answers ────────────────────
  const handleAnswer = (answerText) => {
    stopSpeaking();
    const currentQ = INITIAL_QUESTIONS[currentQIndex];
    const newAnswers = [...answers, { q: currentQ, a: answerText }];
    setAnswers(newAnswers);

    setChatHistory(prev => [
      ...prev,
      { type: 'bot', text: currentQ },
      { type: 'user', text: answerText }
    ]);

    if (currentQIndex < INITIAL_QUESTIONS.length - 1) {
      const nextQ = INITIAL_QUESTIONS[currentQIndex + 1];
      setCurrentQIndex(prev => prev + 1);
      setTimeout(() => speakText(nextQ), 400);
    } else {
      setCurrentQIndex(INITIAL_QUESTIONS.length);
      generateAIGuidance(newAnswers);
    }
  };

  // ── Stream AI Guidance from Groq ──────────────────────────
  const generateAIGuidance = async (finalAnswers) => {
    setIsStreaming(true);
    setStreamBuffer('');
    stopSpeaking();

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/ai/guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symptoms: finalAnswers.map(a => `${a.q}: ${a.a}`)
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamBuffer(fullText);
              }
            } catch (e) {
              // ignore parse errors on incomplete chunks
            }
          }
        }
      }

      setIsStreaming(false);
      setStreamBuffer('');
      if (fullText) {
        setChatHistory(prev => [...prev, { type: 'bot', text: fullText, isFinal: true }]);
        speakText(fullText);
      }
    } catch (err) {
      console.error('Groq AI guide error:', err);
      setIsStreaming(false);
      const fallbackMsg = "⚠️ Connect pressure directly to bleeding wounds with a clean cloth. Keep the victim warm and calm. Do not move their neck if a spine injury is suspected. Emergency responders have been alerted.";
      setChatHistory(prev => [...prev, { type: 'bot', text: fallbackMsg, isFinal: true }]);
      speakText(fallbackMsg);
    }
  };

  // ── Follow-up conversational question to Groq ─────────────
  const handleCustomSubmit = async (textToSend) => {
    const query = textToSend || customInput.trim();
    if (!query || isStreaming) return;

    setCustomInput('');
    stopSpeaking();
    setChatHistory(prev => [...prev, { type: 'user', text: query }]);
    setIsStreaming(true);
    setStreamBuffer('');

    try {
      const token = localStorage.getItem('token');
      const messagesPayload = chatHistory.map(m => ({
        role: m.type === 'bot' ? 'assistant' : 'user',
        content: m.text
      }));

      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: messagesPayload,
          query: query
        })
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamBuffer(fullText);
              }
            } catch (e) {}
          }
        }
      }

      setIsStreaming(false);
      setStreamBuffer('');
      if (fullText) {
        setChatHistory(prev => [...prev, { type: 'bot', text: fullText, isFinal: true }]);
        speakText(fullText);
      }
    } catch (err) {
      console.error('Groq chat error:', err);
      setIsStreaming(false);
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Error connecting to AI. Please perform standard first aid or wait for the responder.', isFinal: true }]);
    }
  };

  const resetAssistant = () => {
    stopSpeaking();
    setCurrentQIndex(0);
    setAnswers([]);
    setChatHistory([]);
    setStreamBuffer('');
    setTimeout(() => speakText(INITIAL_QUESTIONS[0]), 300);
  };

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col h-[560px] border border-gray-700 shadow-2xl">
      
      {/* ── Header ── */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-1.5">
              <span>RescueLink AI Voice Assistant</span>
              <Sparkles size={14} className="text-amber-400" />
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute voice toggle */}
          <button
            onClick={() => {
              if (voiceEnabled) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            title={voiceEnabled ? 'Mute Voice' : 'Enable Voice'}
            className={`p-2 rounded-lg transition ${voiceEnabled ? 'bg-gray-700 text-green-400 hover:bg-gray-600' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Reset button */}
          <button
            onClick={resetAssistant}
            title="Restart Assessment"
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
          >
            <RotateCcw size={16} />
          </button>

          {/* Direct 112 Call */}
          <a
            href="tel:112"
            className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 text-xs transition shadow-md"
          >
            <Phone size={14} /> CALL 112
          </a>
        </div>
      </div>

      {/* ── Shield Banner ── */}
      <div className="bg-green-950/70 border-b border-green-800/80 px-4 py-2 flex items-center justify-between text-xs text-green-300">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck size={15} className="text-green-400 flex-shrink-0" />
          <span>You are legally protected under India's Good Samaritan Law (2016).</span>
        </div>
        {isSpeaking && (
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Volume2 size={12} className="animate-pulse" /> Speaking...
          </span>
        )}
      </div>

      {/* ── Chat Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.type === 'user'
                  ? 'bg-red-600 text-white rounded-tr-none shadow-md font-medium'
                  : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700 shadow-md whitespace-pre-wrap'
              }`}
            >
              <div>{msg.text}</div>
              {msg.type === 'bot' && (
                <div className="mt-2 pt-2 border-t border-gray-700/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => speakText(msg.text)}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-amber-400 transition"
                  >
                    <Volume2 size={12} /> Read aloud
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live streaming text buffer */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3.5 rounded-2xl bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700 shadow-md whitespace-pre-wrap text-sm leading-relaxed">
              {streamBuffer ? (
                <span>
                  {streamBuffer}
                  <span className="inline-block w-2 h-4 bg-red-500 ml-1 animate-pulse" />
                </span>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span>Groq AI is analyzing condition and generating emergency guidance...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Structured Question Prompt */}
        {currentQIndex < INITIAL_QUESTIONS.length && chatHistory.length === currentQIndex * 2 && !isStreaming && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[90%] p-4 rounded-2xl bg-gray-800 text-gray-100 rounded-tl-none border-2 border-red-500/40 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Question {currentQIndex + 1} of {INITIAL_QUESTIONS.length}
                </span>
                {speechSupported && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    🎤 Speak or tap below
                  </span>
                )}
              </div>

              <p className="mb-4 font-bold text-white text-base">
                {INITIAL_QUESTIONS[currentQIndex]}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAnswer('Yes')}
                  className="flex-1 bg-green-600 hover:bg-green-500 active:scale-95 text-white py-2.5 rounded-xl font-black text-sm transition shadow-lg shadow-green-600/30"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleAnswer('No')}
                  className="flex-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white py-2.5 rounded-xl font-black text-sm transition shadow-lg shadow-red-600/30"
                >
                  No
                </button>
                <button
                  onClick={() => handleAnswer('Not Sure')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 active:scale-95 text-gray-300 py-2.5 rounded-xl font-medium text-xs transition"
                >
                  Not Sure
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Bottom Input & Voice Controller ── */}
      <div className="bg-gray-800 p-3.5 border-t border-gray-700">
        {currentQIndex < INITIAL_QUESTIONS.length ? (
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <div className="flex items-center gap-2">
              {isListening ? (
                <div className="flex items-center gap-1.5 text-red-400 font-bold animate-pulse">
                  <Mic size={14} className="animate-bounce" /> Listening for your answer...
                </div>
              ) : (
                <span>Answer the question above or use microphone.</span>
              )}
            </div>

            {speechSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-xl transition flex items-center gap-1 font-bold ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <Mic size={14} />
                <span>{isListening ? 'Stop Listening' : 'Speak Answer'}</span>
              </button>
            )}
          </div>
        ) : (
          /* Conversational follow-up bar after initial guidance */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCustomSubmit();
            }}
            className="flex items-center gap-2"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-xl transition ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak your question'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Ask anything (e.g. 'How to do CPR?', 'Bleeding not stopping')..."
              disabled={isStreaming}
              className="flex-1 bg-gray-700 text-white text-sm px-4 py-2.5 rounded-xl border border-gray-600 focus:border-red-500 outline-none"
            />

            <button
              type="submit"
              disabled={isStreaming || !customInput.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white p-2.5 rounded-xl font-bold transition shadow-md"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
