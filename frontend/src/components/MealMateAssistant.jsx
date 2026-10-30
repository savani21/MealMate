import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api/config.js";
import {
  X, Send, Sparkles, Mic, Volume2, VolumeX, MessageCircle,
  Languages, Loader2, MicOff, RotateCcw
} from "lucide-react";

const LANGUAGES = [
  { code: "en-IN", value: "en", label: "English", short: "EN" },
  { code: "hi-IN", value: "hi", label: "हिन्दी", short: "हि" },
  { code: "gu-IN", value: "gu", label: "ગુજરાતી", short: "ગુ" },
];

const GREETINGS = {
  en: "Hello! I'm MealMate. Tell me what ingredients you have, and I'll help plan your meals for today.",
  hi: "नमस्ते! मैं MealMate हूँ। आपके पास कौन-कौन सी सामग्री है? मैं आज के भोजन की योजना बनाने में मदद करूँगा।",
  gu: "નમસ્તે! હું MealMate છું. તમારી પાસે કઈ સામગ્રી છે? હું આજના ભોજનનું આયોજન કરવામાં મદદ કરીશ.",
};

export default function MealMateAssistant() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(
    () => { const savedUser = JSON.parse(localStorage.getItem("user") || "null"); return localStorage.getItem("mealmateLanguage") || savedUser?.preferredLanguage || "en"; }
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState("");
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const voiceRequestRef = useRef(false);
  const recognitionHandledRef = useRef(false);
  const lastVoiceTranscriptRef = useRef("");
  const lastVoiceTranscriptAtRef = useRef(0);

  const selectedLanguage = LANGUAGES.find((item) => item.value === language) || LANGUAGES[0];

  useEffect(() => {
    setMessages([{ role: "assistant", text: GREETINGS[language] || GREETINGS.en }]);
    localStorage.setItem("mealmateLanguage", language);
    window.dispatchEvent(new CustomEvent("mealmate-language-change", { detail: language }));
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferredLanguage: language }),
      })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (data?.user) {
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...currentUser, ...data.user }));
          }
        })
        .catch((error) => console.error("Could not save language preference:", error));
    }
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  const speak = async (text) => {
    if (!voiceReplies || !("speechSynthesis" in window)) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    setVoiceNotice("");

    // Chrome may initially return an empty voice list; wait briefly for voices to load.
    let voices = synthesis.getVoices();
    if (!voices.length) {
      await new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          synthesis.removeEventListener?.("voiceschanged", finish);
          resolve();
        };
        synthesis.addEventListener?.("voiceschanged", finish, { once: true });
        window.setTimeout(finish, 1200);
      });
      voices = synthesis.getVoices();
    }

    const languagePrefix = selectedLanguage.code.toLowerCase().split("-")[0];
    const matchingVoice = voices.find((voice) => voice.lang?.toLowerCase() === selectedLanguage.code.toLowerCase())
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith(languagePrefix + "-"))
      || voices.find((voice) => voice.lang?.toLowerCase() === languagePrefix);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage.code;
    utterance.rate = 0.96;

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    } else {
      const languageLabel = selectedLanguage.label;
      setVoiceNotice(`No ${languageLabel} speech voice is installed in this browser/device. Install or enable a ${languageLabel} text-to-speech voice, then reload MealMate.`);
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      setSpeaking(false);
      console.error("Speech synthesis error:", event.error);
      if (!matchingVoice) return;
      setVoiceNotice(`Your device could not play the selected ${selectedLanguage.label} voice. Check its text-to-speech language settings.`);
    };
    synthesis.speak(utterance);
  };

  const sendMessage = async (text = input, fromVoice = false) => {
    const userMessage = text.trim();
    if (!userMessage || loading) return;

    const previousMessages = messages;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    voiceRequestRef.current = fromVoice;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          language,
          history: previousMessages.map(({ role, text }) => ({ role, text })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "AI request failed");

      const reply = data.reply || "I couldn't prepare a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      if (voiceReplies) speak(reply);
    } catch (error) {
      console.error("MealMate assistant error:", error);
      const fallback = language === "gu"
        ? "માફ કરશો, અત્યારે MealMate AI સાથે જોડાઈ શકાતું નથી."
        : language === "hi"
          ? "क्षमा करें, अभी MealMate AI से कनेक्ट नहीं हो पा रहा है।"
          : "Sorry, I couldn't connect to MealMate AI. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: fallback }]);
      if (voiceReplies) speak(fallback);
    } finally {
      setLoading(false);
      voiceRequestRef.current = false;
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported here. Please use Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    window.speechSynthesis?.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage.code;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionHandledRef.current = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Voice recognition error:", event.error);
      }
    };
    recognition.onresult = (event) => {
      if (recognitionHandledRef.current) return;

      let spokenText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          spokenText = result[0]?.transcript?.trim() || "";
          if (spokenText) break;
        }
      }

      if (!spokenText) return;

      const now = Date.now();
      const isDuplicate = spokenText.toLocaleLowerCase() === lastVoiceTranscriptRef.current.toLocaleLowerCase()
        && now - lastVoiceTranscriptAtRef.current < 2500;
      if (isDuplicate) {
        recognitionHandledRef.current = true;
        recognition.stop();
        return;
      }

      recognitionHandledRef.current = true;
      lastVoiceTranscriptRef.current = spokenText;
      lastVoiceTranscriptAtRef.current = now;
      recognition.stop();
      sendMessage(spokenText, true);
    };
    recognition.start();
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  return (
    <>
      {open && (
        <section className="fixed bottom-24 right-4 sm:right-6 z-[100] w-[min(410px,calc(100vw-2rem))] bg-white rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden">
          <header className="bg-gradient-to-br from-[#102d55] via-[#155c91] to-[#2589b9] text-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">MealMate</h3>
                  <p className="text-xs text-white/75">Your personal meal companion</p>
                </div>
              </div>
              <button onClick={() => { setOpen(false); stopSpeaking(); recognitionRef.current?.stop(); }} className="p-2 rounded-xl hover:bg-white/15" aria-label="Close assistant">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-white/90">
                <Languages className="w-4 h-4" />
                <span>Language</span>
                <select value={language} onChange={handleLanguageChange} className="bg-white/15 border border-white/20 rounded-lg px-2 py-1.5 text-white outline-none">
                  {LANGUAGES.map((item) => (
                    <option key={item.value} value={item.value} className="text-slate-900">{item.label}</option>
                  ))}
                </select>
              </label>
              <button onClick={() => setVoiceReplies((value) => !value)} className="flex items-center gap-1.5 text-xs bg-white/15 rounded-lg px-2.5 py-2" title={voiceReplies ? "Turn off spoken replies" : "Turn on spoken replies"}>
                {voiceReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Voice {voiceReplies ? "on" : "off"}
              </button>
            </div>
          </header>

          <div className="bg-slate-50 px-4 py-3 flex items-center gap-3 border-b border-slate-100">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${listening ? "bg-rose-100 ring-4 ring-rose-100 animate-pulse" : speaking ? "bg-sky-100 ring-4 ring-sky-50" : "bg-blue-100"}`}>
              {listening ? <Mic className="w-6 h-6 text-rose-600" /> : speaking ? <Volume2 className="w-6 h-6 text-sky-700" /> : <Sparkles className="w-6 h-6 text-blue-700" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{listening ? "I'm listening..." : speaking ? "Speaking..." : loading ? "Thinking..." : "Ready when you are"}</p>
              <p className="text-xs text-slate-500">{listening ? "Speak naturally in your selected language" : "Ask me to plan breakfast, lunch and dinner"}</p>
              {voiceNotice && <p className="text-[11px] text-amber-700 mt-1">{voiceNotice}</p>}
            </div>
            {speaking && <button onClick={stopSpeaking} className="ml-auto text-slate-500 hover:text-slate-800" aria-label="Stop speaking"><VolumeX className="w-5 h-5" /></button>}
          </div>

          <div ref={scrollRef} className="h-[300px] overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-[#1769a6] text-white rounded-br-md" : "bg-slate-100 text-slate-700 rounded-bl-md"}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Preparing your meal ideas...</div>}
          </div>

          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                placeholder={language === "gu" ? "અહીં લખો..." : language === "hi" ? "यहाँ लिखें..." : "Ask MealMate anything..."}
                className="min-w-0 flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button type="button" onClick={startVoiceInput} disabled={loading} className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition ${listening ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"} disabled:opacity-40`} title={listening ? "Stop listening" : "Talk to MealMate"}>
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="w-12 h-12 shrink-0 rounded-2xl bg-[#1769a6] text-white flex items-center justify-center disabled:opacity-40" aria-label="Send message">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">Voice recognition availability depends on your browser and microphone permission.</p>
          </div>
        </section>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-[100] w-16 h-16 rounded-full bg-gradient-to-br from-[#123e70] to-[#2495c5] text-white shadow-xl flex items-center justify-center hover:scale-105 transition-all ring-4 ring-white"
        title="Talk to MealMate"
        aria-label="Open MealMate voice assistant"
      >
        {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </>
  );
}
