import { useState } from "react";
import {
    MessageCircle,
    X,
    Send,
    Sparkles,
} from "lucide-react";

export default function MealMateAssistant() {
    const [open, setOpen] = useState(false);

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hi! 👋 I'm MealMate AI. How can I help you today?",
        },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

const sendMessage = async () => {
  if (!input.trim() || loading) return;

  const userMessage = input.trim();

  const updatedMessages = [
    ...messages,
    {
      role: "user",
      text: userMessage,
    },
  ];

  setMessages(updatedMessages);
  setInput("");
  setLoading(true);

  try {
    const response = await fetch(
      "http://localhost:5000/api/ai/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,

          // Send previous conversation to Gemini
          history: messages.map((msg) => ({
            role: msg.role,
            text: msg.text,
          })),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "AI request failed");
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: data.reply,
      },
    ]);

  } catch (error) {
    console.error("CHAT ERROR:", error);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "Sorry, I couldn't connect to MealMate AI.",
      },
    ]);
  } finally {
    setLoading(false);
  }
};
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    return (
        <>
            { open && (
                <div className="fixed bottom-24 right-5 z-[100] w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

                    {/* Header */ }
                    <div className="bg-primary text-white px-5 py-4 flex items-center justify-between">

                        <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>

                            <div>
                                <h3 className="font-bold">
                                    MealMate AI
                                </h3>

                                <p className="text-xs text-white/80">
                                    Your meal assistant
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={ () => setOpen(false) }
                            className="p-2 rounded-lg hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                    </div>

                    {/* Messages */ }
                    <div className="h-[380px] overflow-y-auto p-4 space-y-3">

                        { messages.map((message, index) => (

                            <div
                                key={ index }
                                className={ `flex ${message.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                    }` }
                            >

                                <div
                                    className={ `max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${message.role === "user"
                                            ? "bg-primary text-white rounded-br-md"
                                            : "bg-gray-100 text-gray-700 rounded-bl-md"
                                        }` }
                                >
                                    { message.text }
                                </div>

                            </div>

                        )) }

                        { loading && (
                            <div className="flex justify-start">

                                <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-2xl text-sm">
                                    MealMate AI is thinking...
                                </div>

                            </div>
                        ) }

                    </div>

                    {/* Input */ }
                    <div className="p-3 border-t border-gray-100">

                        <div className="flex gap-2">

                            <input
                                type="text"
                                value={ input }
                                onChange={ (e) => setInput(e.target.value) }
                                onKeyDown={ handleKeyDown }
                                placeholder="Ask about meals..."
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                            />

                            <button
                                onClick={ sendMessage }
                                disabled={ loading || !input.trim() }
                                className="w-11 h-11 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40"
                            >
                                <Send className="w-5 h-5" />
                            </button>

                        </div>

                    </div>

                </div>
            ) }

            {/* Floating Button */ }
            <button
                onClick={ () => setOpen(!open) }
                className="fixed bottom-5 right-5 z-[100] w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-105 transition"
                title="MealMate AI"
            >
                { open ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                ) }
            </button>
        </>
    );
}