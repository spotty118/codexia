import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ContextFile {
  path: string;
  name: string;
  addedAt: number;
  // Enhanced context metadata
  size?: number;
  type?: 'code' | 'documentation' | 'config' | 'data' | 'other';
  language?: string;
  importance?: 'high' | 'medium' | 'low';
  lastUsed?: number;
  usageCount?: number;
  tags?: string[];
  relatedFiles?: string[];
}

interface ContextPattern {
  id: string;
  name: string;
  filePatterns: string[];
  description: string;
  importance: 'high' | 'medium' | 'low';
  createdAt: number;
}

interface ContextFilesState {
  contextFiles: ContextFile[];
  contextPatterns: ContextPattern[];
  
  // Enhanced file management
  addFile: (path: string, metadata?: Partial<ContextFile>) => void;
  removeFile: (path: string) => void;
  clearFiles: () => void;
  getFileName: (path: string) => string;
  
  // Context analysis and intelligence
  analyzeFileType: (path: string) => ContextFile['type'];
  calculateFileImportance: (file: ContextFile) => ContextFile['importance'];
  suggestRelatedFiles: (currentPath: string) => string[];
  getContextSummary: () => { totalFiles: number; typeBreakdown: Record<string, number>; importantFiles: ContextFile[] };
  
  // Context patterns
  addContextPattern: (name: string, filePatterns: string[], description: string) => void;
  removeContextPattern: (id: string) => void;
  getMatchingPatterns: (filePath: string) => ContextPattern[];
  
  // Usage tracking
  markFileUsed: (path: string) => void;
  getRecentlyUsedFiles: (limit?: number) => ContextFile[];
  getMostUsedFiles: (limit?: number) => ContextFile[];
  
  // Context optimization
  optimizeContext: () => void;
  cleanupOldFiles: (daysOld?: number) => void;
}

export const useContextFilesStore = create<ContextFilesState>()(
  persist(
    (set, get) => ({
      contextFiles: [],
      contextPatterns: [],

      addFile: (path: string, metadata?: Partial<ContextFile>) => {
        const state = get();
        const fileName = state.getFileName(path);
        const existingFile = state.contextFiles.find((f) => f.path === path);
        
        if (existingFile) {
          // Update existing file with new metadata and mark as used
          set((state) => ({
            contextFiles: state.contextFiles.map((f) =>
              f.path === path
                ? {
                    ...f,
                    ...metadata,
                    lastUsed: Date.now(),
                    usageCount: (f.usageCount || 0) + 1,
                  }
                : f
            ),
          }));
          return;
        }

        const fileType = state.analyzeFileType(path);
        const newFile: ContextFile = {
          path,
          name: fileName,
          addedAt: Date.now(),
          lastUsed: Date.now(),
          usageCount: 1,
          type: fileType,
          importance: 'medium',
          tags: [],
          relatedFiles: [],
          ...metadata,
        };

        set((state) => ({
          contextFiles: [...state.contextFiles, newFile],
        }));
      },

      removeFile: (path: string) => {
        set((state) => ({
          contextFiles: state.contextFiles.filter((f) => f.path !== path),
        }));
      },

      clearFiles: () => {
        set({ contextFiles: [] });
      },

      getFileName: (path: string) => {
        return path.split("/").pop() || path;
      },

      analyzeFileType: (path: string): ContextFile['type'] => {
        const extension = path.split('.').pop()?.toLowerCase();
        
        if (['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'php', 'rb', 'swift', 'kt'].includes(extension || '')) {
          return 'code';
        }
        if (['md', 'txt', 'rst', 'adoc', 'html', 'htm'].includes(extension || '')) {
          return 'documentation';
        }
        if (['json', 'yaml', 'yml', 'toml', 'ini', 'env', 'config', 'conf'].includes(extension || '')) {
          return 'config';
        }
        if (['csv', 'xlsx', 'xml', 'sql', 'db'].includes(extension || '')) {
          return 'data';
        }
        return 'other';
      },

      calculateFileImportance: (file: ContextFile): ContextFile['importance'] => {
        let score = 0;
        
        switch (file.type) {
          case 'code': score += 3; break;
          case 'config': score += 2; break;
          case 'documentation': score += 1; break;
          default: score += 0;
        }
        
        if ((file.usageCount || 0) >= 5) score += 2;
        else if ((file.usageCount || 0) >= 2) score += 1;
        
        const daysSinceLastUsed = (Date.now() - (file.lastUsed || file.addedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUsed <= 1) score += 2;
        else if (daysSinceLastUsed <= 7) score += 1;
        
        if (score >= 5) return 'high';
        if (score >= 2) return 'medium';
        return 'low';
      },

      suggestRelatedFiles: (currentPath: string): string[] => {
        const state = get();
        const currentFile = state.contextFiles.find(f => f.path === currentPath);
        if (!currentFile) return [];
        
        const sameTypeFiles = state.contextFiles
          .filter(f => f.path !== currentPath && f.type === currentFile.type)
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
          .slice(0, 3)
          .map(f => f.path);
          
        return sameTypeFiles;
      },

      getContextSummary: () => {
        const state = get();
        const files = state.contextFiles;
        
        const typeBreakdown = files.reduce((acc, file) => {
          acc[file.type || 'other'] = (acc[file.type || 'other'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const importantFiles = files
          .filter(f => f.importance === 'high')
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        
        return {
          totalFiles: files.length,
          typeBreakdown,
          importantFiles,
        };
      },

      addContextPattern: (name: string, filePatterns: string[], description: string) => {
        const id = `pattern-${Date.now()}`;
        const newPattern: ContextPattern = {
          id,
          name,
          filePatterns,
          description,
          importance: 'medium',
          createdAt: Date.now(),
        };
        
        set((state) => ({
          contextPatterns: [...state.contextPatterns, newPattern],
        }));
      },

      removeContextPattern: (id: string) => {
        set((state) => ({
          contextPatterns: state.contextPatterns.filter(p => p.id !== id),
        }));
      },

      getMatchingPatterns: (filePath: string): ContextPattern[] => {
        const state = get();
        return state.contextPatterns.filter(pattern =>
          pattern.filePatterns.some(filePattern => {
            const regex = new RegExp(filePattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
          })
        );
      },

      markFileUsed: (path: string) => {
        set((state) => ({
          contextFiles: state.contextFiles.map((f) =>
            f.path === path
              ? {
                  ...f,
                  lastUsed: Date.now(),
                  usageCount: (f.usageCount || 0) + 1,
                }
              : f
          ),
        }));
      },

      getRecentlyUsedFiles: (limit = 5): ContextFile[] => {
        const state = get();
        return state.contextFiles
          .sort((a, b) => (b.lastUsed || b.addedAt) - (a.lastUsed || a.addedAt))
          .slice(0, limit);
      },

      getMostUsedFiles: (limit = 5): ContextFile[] => {
        const state = get();
        return state.contextFiles
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
          .slice(0, limit);
      },

      optimizeContext: () => {
        set((state) => {
          const optimizedFiles = state.contextFiles.map(file => ({
            ...file,
            importance: state.calculateFileImportance(file),
          }));
          
          return { contextFiles: optimizedFiles };
        });
      },

      cleanupOldFiles: (daysOld = 30) => {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        set((state) => ({
          contextFiles: state.contextFiles.filter(
            f => (f.lastUsed || f.addedAt) > cutoffTime || f.importance === 'high'
          ),
        }));
      },
    }),
    {
      name: "context-files-storage",
    },
  ),
);
