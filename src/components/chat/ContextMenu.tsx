import React from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useContextFilesStore } from '@/stores/ContextFilesStore';
import { useChatInputStore } from '@/stores/chatInputStore';
import { Brain, Plus, BarChart3, Zap } from 'lucide-react';

interface ContextMenuWrapperProps {
  children: React.ReactNode;
  filePath?: string;
  fileName?: string;
}

export const ContextMenuWrapper: React.FC<ContextMenuWrapperProps> = ({
  children,
  filePath,
  fileName,
}) => {
  const { addFile, markFileUsed, getContextSummary } = useContextFilesStore();
  const { addFileReference } = useChatInputStore();

  const handleAddToContext = () => {
    if (filePath) {
      addFile(filePath);
      markFileUsed(filePath);
    }
  };

  const handleAddToChat = () => {
    if (filePath && fileName) {
      addFileReference(filePath, filePath, fileName, false);
    }
  };

  const contextSummary = getContextSummary();

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {filePath && (
          <>
            <ContextMenuItem onClick={handleAddToContext}>
              <Brain className="h-4 w-4 mr-2" />
              Add to Context
            </ContextMenuItem>
            <ContextMenuItem onClick={handleAddToChat}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Chat
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem>
          <BarChart3 className="h-4 w-4 mr-2" />
          Context: {contextSummary.totalFiles} files
        </ContextMenuItem>
        <ContextMenuItem>
          <Zap className="h-4 w-4 mr-2" />
          High Priority: {contextSummary.importantFiles.length}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};