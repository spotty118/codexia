import React, { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCoreStore } from "@/stores/CoreStore";
import { generateUniqueId } from "@/utils/genUniqueId";
import type { ChatMessage } from "@/types/chat";
import { Send, Plus, Trash2 } from "lucide-react";

/**
 * Simplified chat interface focused on the core coding experience
 * Removes complex category management, session handling, and over-engineered features
 */

export const SimpleChatInterface: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    inputValue,
    setInputValue,
    createConversation,
    deleteConversation,
    setCurrentConversation,
    addMessage,
    getCurrentConversation,
    currentModel,
    currentProvider,
  } = useCoreStore();

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConversation = getCurrentConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    let conversationId = currentConversationId;
    
    // Create conversation if none exists
    if (!conversationId) {
      conversationId = createConversation();
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    addMessage(conversationId, userMessage);
    setInputValue("");
    setIsLoading(true);

    try {
      // Start Codex session and send message
      const response = await invoke<string>("send_message", {
        sessionId: conversationId,
        message: inputValue.trim(),
        model: currentModel,
        provider: currentProvider,
      });

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: generateUniqueId(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
        model: currentModel,
      };

      addMessage(conversationId, assistantMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        role: "assistant",
        content: `Error: ${error}`,
        timestamp: Date.now(),
      };

      addMessage(conversationId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    const newId = createConversation();
    setCurrentConversation(newId);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar with conversations */}
      <div className="w-64 border-r bg-muted/30 p-2 flex flex-col">
        <Button
          onClick={handleNewChat}
          className="w-full mb-4 gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                currentConversationId === conv.id ? "bg-muted" : ""
              }`}
              onClick={() => setCurrentConversation(conv.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm truncate">{conv.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentConversation?.messages.map((message) => (
            <Card
              key={message.id}
              className={`max-w-[80%] ${
                message.role === "user" 
                  ? "ml-auto bg-primary text-primary-foreground" 
                  : "mr-auto"
              }`}
            >
              <CardContent className="p-3">
                <div className="text-sm">
                  {message.role === "user" ? "You" : `${currentModel}`}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
              </CardContent>
            </Card>
          ))}
          
          {isLoading && (
            <Card className="max-w-[80%] mr-auto">
              <CardContent className="p-3">
                <div className="text-sm">{currentModel}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  Thinking...
                </div>
              </CardContent>
            </Card>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about your code..."
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            Using {currentProvider} / {currentModel} • Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};