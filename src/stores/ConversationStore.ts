import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, ChatMessage } from "@/types/chat";
import { useFolderStore } from "./FolderStore";
import { generateUniqueId } from "@/utils/genUniqueId";

interface ConversationStore {
  // Core conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  pendingUserInput: string | null;
  pendingNewConversation: boolean;

  // Simplified conversation management
  createConversation: (title?: string, sessionId?: string) => string;
  selectHistoryConversation: (conversation: Conversation) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  toggleFavorite: (id: string) => void;

  // Filtered getters
  getCurrentProjectConversations: () => Conversation[];

  // Session management
  setPendingUserInput: (input: string | null) => void;
  setSessionLoading: (sessionId: string, loading: boolean) => void;
  setPendingNewConversation: (pending: boolean) => void;
  setResumeMeta: (conversationId: string, meta: { codexSessionId?: string; resumePath?: string }) => void;

  // Message management
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  updateLastMessage: (conversationId: string, content: string) => void;
  truncateMessagesFrom: (conversationId: string, fromMessageId: string) => void;

  // Getters
  getCurrentConversation: () => Conversation | null;
  getCurrentMessages: () => ChatMessage[];
}

const generateTitle = (messages: ChatMessage[]): string => {
  const firstUserMessage = messages.find((msg) => msg.role === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    return content.length > 50 ? content.substring(0, 50) + "..." : content;
  }
  return "New Conversation";
};

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: [],
      currentConversationId: null,
      pendingUserInput: null,
      pendingNewConversation: false,

      createConversation: (title?: string, sessionId?: string) => {
        // Use provided sessionId or generate a codex-event-{uuid} format for the conversation
        const id = sessionId || `codex-event-${generateUniqueId()}`;
        const state = get();
        
        // Check if conversation with this ID already exists (unlikely but possible)
        const existingConversation = state.conversations.find(conv => conv.id === id);
        if (existingConversation) {
          // Just set as current if it already exists
          set({ currentConversationId: id });
          return id;
        }

        // Get current folder from FolderStore
        const currentFolder = useFolderStore.getState().currentFolder;

        const now = Date.now();
        const newConversation: Conversation = {
          id,
          title: title || "New Conversation",
          messages: [],
          createdAt: now,
          updatedAt: now,
          isFavorite: false,
          projectRealpath: currentFolder || undefined,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
          pendingNewConversation: true,
        }));

        return id;
      },

      // Select a conversation imported from disk history (jsonl rollout)
      // Ensure it exists in the store and mark resume metadata so ChatInterface can resume
      selectHistoryConversation: (conversation: Conversation) => {
        set((state) => {
          const exists = state.conversations.some((c) => c.id === conversation.id);
          const resumePath = conversation.filePath;
          const updated: Conversation = {
            ...conversation,
            // Map filePath into resume meta for backend resume
            ...(resumePath ? { resumePath } as any : {}),
          } as Conversation;

          if (exists) {
            // Update existing conversation with latest messages
            return {
              conversations: state.conversations.map((conv) =>
                conv.id === conversation.id ? updated : conv
              ),
              currentConversationId: conversation.id,
            };
          } else {
            // Add as new conversation and select it
            return {
              conversations: [updated, ...state.conversations],
              currentConversationId: conversation.id,
            };
          }
        });
      },

      deleteConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversationId:
            state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      setCurrentConversation: (id: string) => {
        set({ currentConversationId: id });
      },

      updateConversationTitle: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title, updatedAt: Date.now() } : conv
          ),
        }));
      },

      toggleFavorite: (id: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, isFavorite: !conv.isFavorite, updatedAt: Date.now() }
              : conv
          ),
        }));
      },

      getCurrentProjectConversations: () => {
        const { conversations } = get();
        const currentFolder = useFolderStore.getState().currentFolder;
        
        if (!currentFolder) {
          return conversations;
        }

        return conversations.filter((conv) => conv.projectRealpath === currentFolder);
      },

      setPendingUserInput: (input: string | null) => {
        set({ pendingUserInput: input });
      },

      setSessionLoading: (sessionId: string, loading: boolean) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === sessionId ? { ...conv, isLoading: loading } : conv
          ),
        }));
      },

      setPendingNewConversation: (pending: boolean) => {
        set({ pendingNewConversation: pending });
      },

      setResumeMeta: (conversationId: string, meta: { codexSessionId?: string; resumePath?: string }) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  codexSessionId: meta.codexSessionId,
                  resumePath: meta.resumePath,
                  updatedAt: Date.now(),
                }
              : conv
          ),
        }));
      },

      addMessage: (conversationId: string, message: ChatMessage) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              const updatedMessages = [...conv.messages, message];
              const newTitle = conv.title === "New Conversation" ? generateTitle(updatedMessages) : conv.title;
              return {
                ...conv,
                messages: updatedMessages,
                title: newTitle,
                updatedAt: Date.now(),
              };
            }
            return conv;
          }),
        }));
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: Date.now(),
                }
              : conv
          ),
        }));
      },

      updateLastMessage: (conversationId: string, content: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === conversationId && conv.messages.length > 0) {
              const updatedMessages = [...conv.messages];
              const lastIndex = updatedMessages.length - 1;
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                content,
                timestamp: Date.now(),
              };
              return {
                ...conv,
                messages: updatedMessages,
                updatedAt: Date.now(),
              };
            }
            return conv;
          }),
        }));
      },

      truncateMessagesFrom: (conversationId: string, fromMessageId: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              const messageIndex = conv.messages.findIndex(msg => msg.id === fromMessageId);
              if (messageIndex >= 0) {
                return {
                  ...conv,
                  messages: conv.messages.slice(0, messageIndex),
                  updatedAt: Date.now(),
                };
              }
            }
            return conv;
          }),
        }));
      },

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get();
        return conversations.find((conv) => conv.id === currentConversationId) || null;
      },

      getCurrentMessages: () => {
        const { getCurrentConversation } = get();
        const conversation = getCurrentConversation();
        return conversation?.messages || [];
      },
    }),
    {
      name: "conversation-storage",
      version: 2, // Increment version to handle breaking changes
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    },
  ),
);