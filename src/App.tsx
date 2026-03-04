/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "./lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { LogIn, Cloud, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { ThemeProvider } from "./contexts/ThemeContext";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setActiveChatId(null);
      return;
    }

    const q = query(
      collection(db, "chats"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const createNewChat = async () => {
    if (!user) return;
    const docRef = await addDoc(collection(db, "chats"), {
      userId: user.uid,
      title: "New Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setActiveChatId(docRef.id);
    setIsSidebarOpen(false);
  };

  const deleteChat = async (id: string) => {
    await deleteDoc(doc(db, "chats", id));
    if (activeChatId === id) setActiveChatId(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a] text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Cloud className="w-12 h-12 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20">
              <Cloud className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Cloud1</h1>
          <p className="text-zinc-400 text-lg">
            Experience the next generation of intelligent conversation. Secure, fast, and always evolving.
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-4 rounded-2xl hover:bg-zinc-200 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen w-full flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Sidebar Container */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id);
              setIsSidebarOpen(false);
            }}
            onNewChat={createNewChat}
            onDeleteChat={deleteChat}
            user={user}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        </div>

        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6 text-blue-500" />
              <span className="font-bold">Cloud1</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </header>

          <AnimatePresence mode="wait">
            {activeChatId ? (
              <ChatWindow key={activeChatId} chatId={activeChatId} user={user} selectedModel={selectedModel} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
              >
                <Cloud className="w-20 h-20 text-zinc-800 mb-6" />
                <h2 className="text-2xl font-semibold text-zinc-400 mb-2">Welcome back, {user.displayName?.split(' ')[0]}</h2>
                <p className="text-zinc-600 max-w-sm">
                  Select a conversation from the sidebar or start a new one to begin chatting with Cloud AI.
                </p>
                <button
                  onClick={createNewChat}
                  className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
                >
                  Start New Chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ThemeProvider>
  );
}


