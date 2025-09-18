import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContextFilesStore } from '@/stores/ContextFilesStore';
import { useChatInputStore } from '@/stores/chatInputStore';
import { 
  FileText, 
  Code, 
  Settings, 
  Database, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Zap,
  X,
  Plus,
  Brain,
  Target
} from 'lucide-react';

interface ContextAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContextAnalyzer: React.FC<ContextAnalyzerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    contextFiles,
    getContextSummary,
    getRecentlyUsedFiles,
    getMostUsedFiles,
    suggestRelatedFiles,
    optimizeContext,
    cleanupOldFiles,
  } = useContextFilesStore();
  
  const { fileReferences, addFileReference } = useChatInputStore();
  const [selectedFileForSuggestions, setSelectedFileForSuggestions] = useState<string>('');

  const contextSummary = useMemo(() => getContextSummary(), [contextFiles]);
  const recentFiles = useMemo(() => getRecentlyUsedFiles(5), [contextFiles]);
  const mostUsedFiles = useMemo(() => getMostUsedFiles(5), [contextFiles]);
  
  const relatedFiles = useMemo(() => {
    if (!selectedFileForSuggestions) return [];
    return suggestRelatedFiles(selectedFileForSuggestions);
  }, [selectedFileForSuggestions, contextFiles]);

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'config': return <Settings className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getImportanceBadgeVariant = (importance: string) => {
    switch (importance) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleAddToChat = (filePath: string) => {
    const file = contextFiles.find(f => f.path === filePath);
    if (file) {
      addFileReference(file.path, file.path, file.name, false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Context Intelligence
            </CardTitle>
            <CardDescription>
              Analyze and optimize your conversation context
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[70vh]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="optimize">Optimize</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contextSummary.totalFiles}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">High Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contextSummary.importantFiles.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">In Current Chat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fileReferences.length}</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    File Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(contextSummary.typeBreakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFileTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(count / contextSummary.totalFiles) * 100} 
                            className="w-20" 
                          />
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    High Priority Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contextSummary.importantFiles.slice(0, 5).map((file) => (
                      <div key={file.path} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          {getFileTypeIcon(file.type || 'other')}
                          <span className="text-sm">{file.name}</span>
                          <Badge variant={getImportanceBadgeVariant(file.importance || 'medium')}>
                            {file.importance}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddToChat(file.path)}
                          disabled={fileReferences.some(ref => ref.path === file.path)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="usage" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recently Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentFiles.map((file) => (
                        <div key={file.path} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            {getFileTypeIcon(file.type || 'other')}
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(file.lastUsed || file.addedAt).toLocaleDateString()}
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddToChat(file.path)}
                              disabled={fileReferences.some(ref => ref.path === file.path)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Most Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mostUsedFiles.map((file) => (
                        <div key={file.path} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            {getFileTypeIcon(file.type || 'other')}
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {file.usageCount || 0} uses
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddToChat(file.path)}
                              disabled={fileReferences.some(ref => ref.path === file.path)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="suggestions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Related File Suggestions</CardTitle>
                  <CardDescription>
                    Select a file to see related files that might be useful for your context
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <select 
                      className="w-full p-2 border rounded"
                      value={selectedFileForSuggestions}
                      onChange={(e) => setSelectedFileForSuggestions(e.target.value)}
                    >
                      <option value="">Select a file...</option>
                      {fileReferences.map((ref) => (
                        <option key={ref.path} value={ref.path}>
                          {ref.name}
                        </option>
                      ))}
                    </select>
                    
                    {relatedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Suggested Related Files:</h4>
                        {relatedFiles.map((filePath) => {
                          const file = contextFiles.find(f => f.path === filePath);
                          if (!file) return null;
                          
                          return (
                            <div key={filePath} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                {getFileTypeIcon(file.type || 'other')}
                                <span className="text-sm">{file.name}</span>
                                <Badge variant={getImportanceBadgeVariant(file.importance || 'medium')}>
                                  {file.importance}
                                </Badge>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAddToChat(file.path)}
                                disabled={fileReferences.some(ref => ref.path === file.path)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {selectedFileForSuggestions && relatedFiles.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No related files found for the selected file.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="optimize" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Context Optimization
                  </CardTitle>
                  <CardDescription>
                    Tools to keep your context organized and efficient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <h4 className="font-medium">Recalculate File Importance</h4>
                        <p className="text-sm text-muted-foreground">
                          Update importance scores based on current usage patterns
                        </p>
                      </div>
                      <Button onClick={optimizeContext}>
                        Optimize
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <h4 className="font-medium">Cleanup Old Files</h4>
                        <p className="text-sm text-muted-foreground">
                          Remove files not used in the last 30 days (except high priority)
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => cleanupOldFiles(30)}
                      >
                        Cleanup
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded bg-muted/50">
                      <h4 className="font-medium mb-2">Tips for Better Context:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Keep your context files relevant to the current task</li>
                        <li>• Remove outdated files to reduce noise</li>
                        <li>• Use high-importance files as the foundation</li>
                        <li>• Add related files when switching topics</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};