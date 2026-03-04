import { User } from "firebase/auth";
import { Plus, MessageSquare, Trash2, LogOut, User as UserIcon, Cloud, Info, Cpu, Sun, Moon } from "lucide-react";
import { auth } from "../lib/firebase";
import { cn } from "../lib/utils";
import { useTheme } from "../contexts/ThemeContext";

interface SidebarProps {
  chats: any[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  user: User;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const MODELS = [
  { id: "gemini-3-flash-preview", name: "Cloud 1", desc: "Balanced & Stable" },
];

export function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, user, selectedModel, onSelectModel }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-full h-full border-r border-white/5 flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-3 px-2 mb-8">
          <Cloud className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold tracking-tight">Cloud1</span>
        </div>

        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all group"
        >
          <Plus className="w-5 h-5 text-zinc-400 group-hover:text-white" />
          <span className="text-sm font-medium">New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 px-2 mt-4">Recent Chats</p>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all",
              activeChatId === chat.id ? "bg-blue-600/10 text-blue-400" : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
            )}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate flex-1">{chat.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="px-2 space-y-3">
          <div className="flex items-center gap-2 text-zinc-500">
            <Info className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">About & Settings</span>
          </div>
          
          <div className="space-y-1">
            <p className="text-[9px] text-zinc-500 font-bold uppercase px-1">Choose Model</p>
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left",
                  selectedModel === model.id ? "bg-blue-600/10 border border-blue-500/20" : "hover:bg-white/5 border border-transparent"
                )}
              >
                <Cpu className={cn("w-3 h-3", selectedModel === model.id ? "text-blue-400" : "text-zinc-500")} />
                <span className={cn("text-[11px] font-medium", selectedModel === model.id ? "text-blue-400" : "text-zinc-400")}>{model.name}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-2 border-t border-white/5">
            <p className="text-[9px] text-zinc-500 font-bold uppercase px-1">Theme</p>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left hover:bg-white/5 border border-transparent"
            >
              {theme === "dark" ? (
                <Moon className="w-3 h-3 text-blue-400" />
              ) : (
                <Sun className="w-3 h-3 text-yellow-400" />
              )}
              <span className="text-[11px] font-medium text-zinc-400">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </button>
          </div>

          <p className="text-xs text-zinc-400 pt-2 border-t border-white/5">AI made by <span className="text-blue-400 font-semibold">Rehan</span></p>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 truncate">
            <p className="text-xs font-medium truncate">{user.displayName}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="p-2 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
