import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, MessageCircle, Bot, Minimize2, Building2, Globe, Home, Mail, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLeadForm?: boolean;
}

interface LeadForm {
  propertyName: string;
  country: string;
  propertyType: string;
  email: string;
}

interface LeadFormErrors {
  propertyName?: string;
  country?: string;
  propertyType?: string;
  email?: string;
}

const PROPERTY_TYPES = [
  "Hotel",
  "Resort",
  "Villa Complex",
  "Boutique Hotel",
  "Apartment Rental",
  "Hostel",
  "Glamping",
  "B&B",
  "Other",
];

const WELCOME_SUGGESTIONS = [
  "What features does OSS offer?",
  "How much does it cost?",
  "Can I get a demo?",
  "How does smart room control work?",
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const timeStr = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex flex-col items-end gap-1 max-w-[78%]">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-[10px] text-slate-400 px-1">{timeStr}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-1 max-w-[78%]">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-[10px] text-slate-400 px-1">{timeStr}</span>
      </div>
    </div>
  );
}

function LeadFormBubble({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: LeadForm) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<LeadForm>({
    propertyName: "",
    country: "",
    propertyType: "",
    email: "",
  });
  const [errors, setErrors] = useState<LeadFormErrors>({});

  function validate(): boolean {
    const newErrors: LeadFormErrors = {};
    if (!form.propertyName.trim()) newErrors.propertyName = "Required";
    if (!form.country.trim()) newErrors.country = "Required";
    if (!form.propertyType) newErrors.propertyType = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Valid email required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-[90%]">
        <div className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-2xl rounded-bl-sm shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Request a Demo</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">We'll set up a personalized demo for your property.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Property Name
              </label>
              <input
                type="text"
                placeholder="Grand Palace Hotel"
                value={form.propertyName}
                onChange={e => setForm(f => ({ ...f, propertyName: e.target.value }))}
                data-testid="input-property-name"
                className={cn(
                  "w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all",
                  errors.propertyName ? "border-red-400" : "border-slate-200 dark:border-slate-600"
                )}
              />
              {errors.propertyName && <p className="text-xs text-red-500 mt-0.5">{errors.propertyName}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Country
              </label>
              <input
                type="text"
                placeholder="Azerbaijan, Turkey, UAE..."
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                data-testid="input-country"
                className={cn(
                  "w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all",
                  errors.country ? "border-red-400" : "border-slate-200 dark:border-slate-600"
                )}
              />
              {errors.country && <p className="text-xs text-red-500 mt-0.5">{errors.country}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <Home className="w-3.5 h-3.5 text-indigo-400" />
                Property Type
              </label>
              <select
                value={form.propertyType}
                onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))}
                data-testid="select-property-type"
                className={cn(
                  "w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all appearance-none",
                  errors.propertyType ? "border-red-400" : "border-slate-200 dark:border-slate-600"
                )}
              >
                <option value="">Select type...</option>
                {PROPERTY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.propertyType && <p className="text-xs text-red-500 mt-0.5">{errors.propertyType}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@yourhotel.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                data-testid="input-email"
                className={cn(
                  "w-full text-sm px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all",
                  errors.email ? "border-red-400" : "border-slate-200 dark:border-slate-600"
                )}
              />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit-lead"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Schedule My Demo
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLeadFormVisible, setIsLeadFormVisible] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isLeadFormVisible, scrollToBottom]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "👋 Hi there! I'm the OSS virtual assistant.\n\nI can help you explore features, pricing, integrations, and set up a demo for your property. What would you like to know?",
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
    if (isOpen) {
      setHasUnread(false);
      setIsMinimized(false);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  const addMessage = (role: MessageRole, content: string, isLeadForm = false): ChatMessage => {
    const msg: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      isLeadForm,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setInput("");
    addMessage("user", trimmed);
    setIsTyping(true);
    setIsLeadFormVisible(false);

    const history = messages
      .filter(m => !m.isLeadForm)
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setIsTyping(false);

      if (data.type === "lead_form") {
        addMessage("assistant", data.message);
        setIsLeadFormVisible(true);
      } else {
        addMessage("assistant", data.content || "I couldn't process your request. Please try again.");
      }

      if (!isOpen) setHasUnread(true);
    } catch {
      setIsTyping(false);
      addMessage("assistant", "I'm having a connection issue. Please try again in a moment. 🔄");
    }
  };

  const handleLeadSubmit = async (formData: LeadForm) => {
    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/ai-chat/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setIsLeadFormVisible(false);
      addMessage("assistant", data.type === "message" ? data.content : "Thank you! We'll be in touch soon. 🎉");
    } catch {
      addMessage("assistant", "Sorry, something went wrong saving your information. Please email us at support@ossaiproapp.com");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestion = (text: string) => sendMessage(text);

  return (
    <>
      {isOpen && (
        <div
          data-testid="ai-chat-window"
          className="fixed bottom-24 right-5 w-[360px] max-h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-[9999] overflow-hidden"
          style={{ animation: "slideUp 0.25s ease-out" }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-700 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">OSS Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[11px] text-indigo-200">Online · Replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                data-testid="button-minimize-chat"
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                data-testid="button-close-chat"
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-0 min-h-0"
            style={{ maxHeight: "380px" }}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLeadFormVisible && (
              <LeadFormBubble
                onSubmit={handleLeadSubmit}
                isSubmitting={isSubmittingLead}
              />
            )}

            {isTyping && <TypingIndicator />}

            {messages.length === 1 && !isTyping && (
              <div className="mt-2 mb-2">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 px-1">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {WELCOME_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      data-testid={`button-suggestion-${s.slice(0, 10).replace(/\s/g, "-").toLowerCase()}`}
                      className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-300 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isTyping}
                data-testid="input-chat-message"
                className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none disabled:opacity-60"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                data-testid="button-send-message"
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-sm active:scale-95 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-2">
              Powered by OSS · AI assistant
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleOpen}
        data-testid="button-open-chat"
        className={cn(
          "fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
          "hover:shadow-indigo-300 dark:hover:shadow-indigo-900 hover:shadow-xl",
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100",
        )}
        title="Chat with OSS Assistant"
        aria-label="Open AI chat assistant"
      >
        {isMinimized ? (
          <MessageCircle className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
      `}</style>
    </>
  );
}
