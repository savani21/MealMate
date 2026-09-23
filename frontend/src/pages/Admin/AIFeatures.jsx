import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChefHat,
  ClipboardList,
  Send,
  Bot,
} from "lucide-react";

export default function AIFeatures() {
  const [, setLocation] = useLocation();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/admin/ai/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load AI status");
        return;
      }

      setStatus(data.status);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    const message = chatInput.trim();
    if (!message || sending) return;

    setChatHistory((prev) => [...prev, { role: "user", text: message }]);
    setChatInput("");
    setSending(true);

    try {
      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: chatHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        setChatHistory((prev) => [
          ...prev,
          { role: "model", text: data.message || "The AI assistant returned an error." },
        ]);
        return;
      }

      setChatHistory((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev,
        { role: "model", text: "Unable to reach the AI service." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">AI Features</h1>
              <p className="text-xs text-gray-400">Gemini-powered assistant & generation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading || !status ? (
          <p className="text-gray-400">Loading AI status...</p>
        ) : (
          <>
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    status.configured ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  {status.configured ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">
                    Gemini API {status.configured ? "Connected" : "Not Configured"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {status.configured
                      ? `Model in use: ${status.model}`
                      : "Add GEMINI_API_KEY to your backend .env file."}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                icon={<Sparkles className="w-6 h-6 text-primary" />}
                label="AI-Generated Recipes"
                value={status.aiRecipes}
              />
              <StatCard
                icon={<ChefHat className="w-6 h-6 text-primary" />}
                label="Manually Added Recipes"
                value={status.manualRecipes}
              />
              <StatCard
                icon={<ClipboardList className="w-6 h-6 text-primary" />}
                label="AI Meal Plans Generated"
                value={status.aiMealPlans}
              />
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <Bot className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black text-gray-900">Test the AI Assistant</h2>
              </div>

              <div className="border border-gray-100 rounded-xl bg-gray-50/60 h-80 overflow-y-auto p-4 flex flex-col gap-3">
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 m-auto">
                    Send a message to verify the assistant is responding correctly.
                  </p>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-white self-end rounded-br-sm"
                          : "bg-white border border-gray-100 text-gray-700 self-start rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))
                )}
                {sending && (
                  <div className="bg-white border border-gray-100 text-gray-400 self-start rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
                    Thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
                  placeholder="e.g. Suggest a high-protein breakfast"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={sendTestMessage}
                  disabled={sending || !chatInput.trim()}
                  className="bg-primary text-white px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
