import React, { useMemo } from 'react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { VirtualizedTextRenderer } from '../VirtualizedTextRenderer';
import { StreamingMessage } from '../StreamingMessage';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useContextFilesStore } from '@/stores/ContextFilesStore';
import type { ChatMessage } from '@/types/chat';
import { 
  Brain, 
  FileText, 
  Code, 
  Settings, 
  Database, 
  Target,
  Zap
} from 'lucide-react';

interface AgentMessageProps {
  message: ChatMessage;
  selectedText?: string;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
  const { contextFiles } = useContextFilesStore();

  // Analyze context relevance for this message
  const contextAnalysis = useMemo(() => {
    const messageContent = message.content.toLowerCase();
    
    // Extract potential file references from message
    const fileExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'json', 'yml', 'yaml', 'md'];
    const mentionedExtensions = fileExtensions.filter(ext => 
      messageContent.includes(`.${ext}`) || messageContent.includes(`${ext} file`)
    );
    
    // Check if message discusses any files in context
    const discussedFiles = contextFiles.filter(file => 
      messageContent.includes(file.name.toLowerCase()) ||
      messageContent.includes(file.path.toLowerCase())
    );
    
    return {
      mentionedExtensions,
      discussedFiles,
      hasContextRelevance: discussedFiles.length > 0 || mentionedExtensions.length > 0,
    };
  }, [message.content, contextFiles]);

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="h-3 w-3" />;
      case 'documentation': return <FileText className="h-3 w-3" />;
      case 'config': return <Settings className="h-3 w-3" />;
      case 'data': return <Database className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const shouldUseVirtualizedRenderer = () => {
    const lineCount = message.content.split('\n').length;
    const charCount = message.content.length;
    return lineCount > 100 || charCount > 10000;
  };

  if (message.isStreaming) {
    return (
      <StreamingMessage 
        message={{
          id: message.id,
          role: message.role as "user" | "assistant" | "system",
          content: message.content,
          timestamp: message.timestamp,
          isStreaming: message.isStreaming
        }}
      />
    );
  }

  const MessageContent = () => {
    if (shouldUseVirtualizedRenderer()) {
      return <VirtualizedTextRenderer content={message.content} />;
    }
    return <MarkdownRenderer content={message.content} />;
  };

  return (
    <div className="space-y-3">
      {/* Main message content */}
      <div className="ag-message-content">
        <MessageContent />
      </div>
      
      {/* Context intelligence panel */}
      {contextAnalysis.hasContextRelevance && (
        <Card className="p-3 bg-muted/30 border-l-4 border-l-blue-500">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Context Intelligence
                </span>
                <Zap className="h-3 w-3 text-blue-500" />
              </div>
              
              {/* Discussed files */}
              {contextAnalysis.discussedFiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Referenced files in your context:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {contextAnalysis.discussedFiles.map((file) => (
                      <Badge 
                        key={file.path} 
                        variant="outline" 
                        className="text-xs gap-1"
                      >
                        {getFileTypeIcon(file.type || 'other')}
                        {file.name}
                        <Target className="h-2 w-2" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* File type indicators */}
              {contextAnalysis.mentionedExtensions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Mentioned file types:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {contextAnalysis.mentionedExtensions.map((ext) => (
                      <Badge key={ext} variant="secondary" className="text-xs">
                        .{ext}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      
      {/* Enhanced reasoning display for plan_update messages */}
      {message.messageType === 'plan_update' && message.plan && (
        <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Agent Plan Update
                </span>
              </div>
              
              {message.plan.explanation && (
                <p className="text-sm text-muted-foreground">
                  {message.plan.explanation}
                </p>
              )}
              
              <div className="space-y-1">
                {message.plan.plan.map((step, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'in_progress' ? 'bg-yellow-500' :
                      'bg-gray-300'
                    }`} />
                    <span className={
                      step.status === 'completed' ? 'line-through text-muted-foreground' : ''
                    }>
                      {step.step}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {step.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Tool execution indicator */}
      {message.messageType === 'tool_call' && message.toolInfo && (
        <Card className="p-3 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-500">
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Tool: {message.toolInfo.name}
                </span>
                <Badge 
                  variant={message.toolInfo.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {message.toolInfo.status}
                </Badge>
              </div>
              {message.toolInfo.duration && (
                <p className="text-xs text-muted-foreground">
                  Duration: {message.toolInfo.duration}ms
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};