import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCoreStore } from "@/stores/CoreStore";
import { SimpleChatInterface } from "@/components/SimpleChatInterface";
import { SimpleSettings } from "@/components/SimpleSettings";
import { FileTree } from "@/components/filetree/FileTreeView";
import { 
  MessageSquare, 
  Settings, 
  Files, 
  PanelLeftClose, 
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor
} from "lucide-react";

/**
 * Simplified app layout focused on core functionality
 * Clean, minimal design that emphasizes the coding experience
 */

type View = 'chat' | 'settings';

export const SimpleApp: React.FC = () => {
  const {
    showFileTree,
    toggleFileTree,
    currentFolder,
    setCurrentFolder,
    theme,
    setTheme,
  } = useCoreStore();

  const [currentView, setCurrentView] = useState<View>('chat');

  const handleFolderSelect = async () => {
    try {
      // This would integrate with Tauri's file dialog
      const selectedFolder = await (window as any).__TAURI__?.dialog?.open({
        directory: true,
        multiple: false,
      });
      
      if (selectedFolder) {
        setCurrentFolder(selectedFolder);
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Codexia</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Simple & Vibe
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="gap-2"
          >
            {getThemeIcon()}
          </Button>

          {/* View tabs */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={currentView === 'chat' ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView('chat')}
              className="rounded-none gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={currentView === 'settings' ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView('settings')}
              className="rounded-none gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* File tree toggle */}
          {currentView === 'chat' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFileTree}
              className="gap-2"
            >
              {showFileTree ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              Files
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* File Tree Sidebar */}
        {currentView === 'chat' && showFileTree && (
          <div className="w-80 border-r bg-muted/20 flex flex-col">
            <div className="p-3 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFolderSelect}
                className="w-full gap-2"
              >
                <Files className="w-4 h-4" />
                {currentFolder ? "Change Folder" : "Select Folder"}
              </Button>
              {currentFolder && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {currentFolder}
                </p>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden">
              {currentFolder ? (
                <FileTree
                  currentFolder={currentFolder}
                  onAddToChat={(path) => {
                    // Simple file addition to chat context
                    console.log("Add to chat:", path);
                  }}
                  onFileClick={(path) => {
                    // Simple file preview
                    console.log("File clicked:", path);
                  }}
                />
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Select a folder to browse files
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {currentView === 'chat' ? (
            <SimpleChatInterface />
          ) : (
            <SimpleSettings />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 text-xs text-muted-foreground bg-muted/30">
        <div className="flex items-center justify-between">
          <span>Ready for vibe coding</span>
          <span>
            {currentFolder ? `📁 ${currentFolder.split('/').pop()}` : '📁 No folder selected'}
          </span>
        </div>
      </div>
    </div>
  );
};