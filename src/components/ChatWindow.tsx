import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getGeminiStream } from "../services/gemini";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface ChatWindowProps {
  chatId: string;
  user: User;
  selectedModel: string;
}

export function ChatWindow({ chatId, user, selectedModel }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgList);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamingMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setIsTyping(true);
    setStreamingMessage("");

    try {
      // Start both operations in parallel: saving user message and calling Gemini
      const userMsgPromise = addDoc(collection(db, "chats", chatId, "messages"), {
        text: userMessage,
        sender: "user",
        createdAt: serverTimestamp(),
      });

      // Update chat title if it's the first message (don't await yet)
      const titlePromise = messages.length === 0 
        ? updateDoc(doc(db, "chats", chatId), {
            title: userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : ""),
            updatedAt: serverTimestamp(),
          })
        : updateDoc(doc(db, "chats", chatId), {
            updatedAt: serverTimestamp(),
          });

      // Prepare history for Gemini
      const history = [
        ...messages.map(msg => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        })),
        { role: "user", parts: [{ text: userMessage }] }
      ];

      // Start Gemini stream immediately
      const streamPromise = getGeminiStream(history);
      const stream = await streamPromise;
      
      let fullResponse = "";
      let lastUpdateTime = Date.now();
      setIsTyping(false);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullResponse += chunkText;
          
          // Throttle UI updates to every 50ms for maximum smoothness
          const now = Date.now();
          if (now - lastUpdateTime > 50) {
            setStreamingMessage(fullResponse);
            lastUpdateTime = now;
          }
        }
      }
      
      // Final update to ensure the last bit of text is shown
      setStreamingMessage(fullResponse);

      // Clear streaming message BEFORE saving to avoid double-render when onSnapshot fires
      setStreamingMessage(null);

      // Once finished, save the full response to Firestore
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: fullResponse,
        sender: "ai",
        createdAt: serverTimestamp(),
      });
      
      // Ensure DB updates are finished (though they likely are by now)
      await Promise.all([userMsgPromise, titlePromise]);
    } catch (error) {
      console.error("Failed to send message", error);
      setIsTyping(false);
      setStreamingMessage(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={cn(
              "flex gap-4 max-w-3xl mx-auto",
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              msg.sender === "user" ? "bg-blue-600" : "bg-zinc-800"
            )}>
              {msg.sender === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
            </div>
            <div className={cn(
              "px-4 py-2 rounded-2xl text-sm leading-relaxed",
              msg.sender === "user" ? "bg-blue-600/10 text-blue-100" : "bg-zinc-900 text-zinc-300"
            )}>
              <div className="markdown-body">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {streamingMessage !== null && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="px-4 py-2 rounded-2xl text-sm leading-relaxed bg-zinc-900 text-zinc-300">
              <div className="markdown-body">
                <Markdown>{streamingMessage}</Markdown>
              </div>
            </div>
          </div>
        )}
        {isTyping && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-zinc-900 text-zinc-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-medium">Cloud1 is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 border-t border-white/5 bg-[#0a0a0a]">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Cloud1..."
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[10px] text-center text-zinc-600 mt-4">
          Cloud1 can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
