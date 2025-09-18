import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, ChatMessage } from "@/types/chat";
import { generateUniqueId } from "@/utils/genUniqueId";

/**
 * Simplified core store combining chat, conversations, and basic app state
 * Reduces complexity from 13 stores to 1 main store
 */

export type Provider = "openai" | "google" | "ollama" | "openrouter" | "xai" | "langchain";

type ProviderConfig = {
  apiKey: string;
  baseUrl: string;
  models: string[];
};

type Providers = Record<Provider, ProviderConfig>;

interface CoreStore {
  // App State
  currentFolder: string | null;
  theme: 'light' | 'dark' | 'system';
  showFileTree: boolean;
  showChatPane: boolean;
  
  // Chat & Conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  inputValue: string;
  
  // Models & Providers  
  providers: Providers;
  currentModel: string;
  currentProvider: Provider;
  reasoningEffort: 'high' | 'medium' | 'low' | 'minimal';
  
  // Actions - App
  setCurrentFolder: (folder: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleFileTree: () => void;
  toggleChatPane: () => void;
  
  // Actions - Chat
  setInputValue: (value: string) => void;
  setCurrentConversation: (id: string | null) => void;
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateLastMessage: (conversationId: string, content: string) => void;
  
  // Actions - Models
  setCurrentModel: (model: string, provider: Provider) => void;
  setReasoningEffort: (effort: 'high' | 'medium' | 'low' | 'minimal') => void;
  setProviderApiKey: (provider: Provider, key: string) => void;
  
  // Getters
  getCurrentConversation: () => Conversation | null;
}

const DEFAULT_PROVIDERS: Providers = {
  openai: {
    apiKey: "",
    baseUrl: "",
    models: ["gpt-5", "gpt-5-codex"],
  },
  ollama: {
    apiKey: "",
    baseUrl: "http://localhost:11434/v1",
    models: ["gpt-oss:20b", "mistral", "qwen3", "deepseek-r1"],
  },
  google: {
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: ["gemini-2.5-flash", "gemini-2.5-pro"],
  },
  openrouter: {
    apiKey: "",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-oss-20b:free",
    ],
  },
  xai: {
    apiKey: "",
    baseUrl: "https://api.x.ai/v1",
    models: ["grok-code-fast-1", "grok-4"]
  },
  langchain: {
    apiKey: "",
    baseUrl: "http://localhost:8000", // Default LangChain server
    models: ["langchain-agent", "custom-chain"]
  }
};

export const useCoreStore = create<CoreStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentFolder: null,
      theme: 'system',
      showFileTree: true,
      showChatPane: true,
      
      conversations: [],
      currentConversationId: null,
      inputValue: "",
      
      providers: { ...DEFAULT_PROVIDERS },
      currentModel: 'gpt-5-codex',
      currentProvider: 'openai',
      reasoningEffort: 'medium',
      
      // App actions
      setCurrentFolder: (folder) => set({ currentFolder: folder }),
      setTheme: (theme) => set({ theme }),
      toggleFileTree: () => set((state) => ({ showFileTree: !state.showFileTree })),
      toggleChatPane: () => set((state) => ({ showChatPane: !state.showChatPane })),
      
      // Chat actions
      setInputValue: (value) => set({ inputValue: value }),
      setCurrentConversation: (id) => set({ currentConversationId: id }),
      
      createConversation: (title = "New Chat") => {
        const id = generateUniqueId();
        const newConversation: Conversation = {
          id,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => ({
          conversations: [...state.conversations, newConversation],
          currentConversationId: id,
        }));
        
        return id;
      },
      
      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter(c => c.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },
      
      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, message], updatedAt: Date.now() }
              : conv
          ),
        }));
      },
      
      updateLastMessage: (conversationId, content) => {
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg, index) =>
                    index === conv.messages.length - 1
                      ? { ...msg, content }
                      : msg
                  ),
                  updatedAt: Date.now(),
                }
              : conv
          ),
        }));
      },
      
      // Model actions
      setCurrentModel: (model, provider) => set({ currentModel: model, currentProvider: provider }),
      setReasoningEffort: (effort) => set({ reasoningEffort: effort }),
      
      setProviderApiKey: (provider, key) =>
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: { ...state.providers[provider], apiKey: key },
          },
        })),
      
      // Getters
      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find(c => c.id === state.currentConversationId) || null;
      },
    }),
    {
      name: "core-storage",
    },
  ),
);