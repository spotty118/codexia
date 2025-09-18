import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  CodebaseSteeringFile,
  CodebaseSteeringConfig,
  CodebaseSteeringState,
  ProductOverview,
  TechnologyStack,
  ProjectStructure
} from '@/types/codebaseSteering';
import { 
  DEFAULT_PRODUCT_TEMPLATE,
  DEFAULT_TECH_TEMPLATE,
  DEFAULT_STRUCTURE_TEMPLATE
} from '@/types/codebaseSteering';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

interface CodebaseSteeringStore extends CodebaseSteeringState {
  // Configuration management
  createConfiguration: (codebaseName: string, codebasePath: string) => string;
  updateConfiguration: (id: string, updates: Partial<CodebaseSteeringConfig>) => void;
  deleteConfiguration: (id: string) => void;
  getCurrentConfiguration: () => CodebaseSteeringConfig | null;
  setCurrentCodebase: (codebaseId: string) => void;
  
  // File generation
  generateSteeringFiles: (configId: string) => Promise<{ product: string; tech: string; structure: string }>;
  generateProductFile: (config: CodebaseSteeringConfig) => string;
  generateTechFile: (config: CodebaseSteeringConfig) => string;
  generateStructureFile: (config: CodebaseSteeringConfig) => string;
  
  // File management
  saveFile: (file: Omit<CodebaseSteeringFile, 'id' | 'created_at' | 'updated_at'>) => string;
  updateFile: (id: string, updates: Partial<CodebaseSteeringFile>) => void;
  deleteFile: (id: string) => void;
  getFilesForCodebase: (codebaseId: string) => CodebaseSteeringFile[];
  
  // Auto-detection utilities
  detectProjectStructure: (codebasePath: string) => Promise<Partial<ProjectStructure>>;
  detectTechnologyStack: (codebasePath: string) => Promise<Partial<TechnologyStack>>;
  suggestProductOverview: (codebaseName: string, codebasePath: string) => Promise<Partial<ProductOverview>>;
}

export const useCodebaseSteeringStore = create<CodebaseSteeringStore>()(
  persist(
    (set, get) => ({
      configurations: {},
      files: {},
      current_codebase: undefined,
      templates: {
        product: DEFAULT_PRODUCT_TEMPLATE,
        tech: DEFAULT_TECH_TEMPLATE,
        structure: DEFAULT_STRUCTURE_TEMPLATE,
      },

      createConfiguration: (codebaseName: string, codebasePath: string) => {
        const id = generateId();
        const now = Date.now();
        
        const config: CodebaseSteeringConfig = {
          product: {
            name: codebaseName,
            purpose: '',
            target_users: [],
            key_features: [],
            business_objectives: [],
          },
          tech: {
            frontend: {
              framework: '',
            },
            development_tools: {
              package_manager: 'npm',
              version_control: 'git',
            },
            constraints: {},
          },
          structure: {
            root_directory: codebasePath,
            main_directories: [],
            file_naming_conventions: {},
            import_patterns: {},
            architectural_decisions: [],
          },
          generated_at: now,
          codebase_path: codebasePath,
          codebase_name: codebaseName,
        };

        set((state) => ({
          configurations: {
            ...state.configurations,
            [id]: config,
          },
          current_codebase: id,
        }));

        return id;
      },

      updateConfiguration: (id: string, updates: Partial<CodebaseSteeringConfig>) => {
        set((state) => {
          const existing = state.configurations[id];
          if (!existing) return state;

          return {
            configurations: {
              ...state.configurations,
              [id]: {
                ...existing,
                ...updates,
                generated_at: Date.now(),
              },
            },
          };
        });
      },

      deleteConfiguration: (id: string) => {
        set((state) => {
          const { [id]: deleted, ...remaining } = state.configurations;
          const newCurrentCodebase = state.current_codebase === id 
            ? Object.keys(remaining)[0] || undefined 
            : state.current_codebase;

          return {
            configurations: remaining,
            current_codebase: newCurrentCodebase,
          };
        });
      },

      getCurrentConfiguration: () => {
        const state = get();
        if (!state.current_codebase) return null;
        return state.configurations[state.current_codebase] || null;
      },

      setCurrentCodebase: (codebaseId: string) => {
        set({ current_codebase: codebaseId });
      },

      generateSteeringFiles: async (configId: string) => {
        const state = get();
        const config = state.configurations[configId];
        if (!config) {
          throw new Error('Configuration not found');
        }

        const productContent = get().generateProductFile(config);
        const techContent = get().generateTechFile(config);
        const structureContent = get().generateStructureFile(config);

        // Save files to store
        get().saveFile({
          filename: 'product.md',
          content: productContent,
          type: 'product',
          codebase_path: config.codebase_path,
          codebase_name: config.codebase_name,
        });

        get().saveFile({
          filename: 'tech.md',
          content: techContent,
          type: 'tech',
          codebase_path: config.codebase_path,
          codebase_name: config.codebase_name,
        });

        get().saveFile({
          filename: 'structure.md',
          content: structureContent,
          type: 'structure',
          codebase_path: config.codebase_path,
          codebase_name: config.codebase_name,
        });

        return {
          product: productContent,
          tech: techContent,
          structure: structureContent,
        };
      },

      generateProductFile: (config: CodebaseSteeringConfig) => {
        const template = get().templates.product;
        return template
          .replace('{purpose}', config.product.purpose || 'To be defined')
          .replace('{target_users}', config.product.target_users.map(user => `- ${user}`).join('\n') || '- To be defined')
          .replace('{key_features}', config.product.key_features.map(feature => `- ${feature}`).join('\n') || '- To be defined')
          .replace('{business_objectives}', config.product.business_objectives.map(obj => `- ${obj}`).join('\n') || '- To be defined')
          .replace('{success_metrics}', (config.product.success_metrics || []).map(metric => `- ${metric}`).join('\n') || '- To be defined')
          .replace('{constraints}', (config.product.constraints || []).map(constraint => `- ${constraint}`).join('\n') || '- None specified')
          .replace('{generated_at}', new Date(config.generated_at).toISOString())
          .replace('{codebase_name}', config.codebase_name);
      },

      generateTechFile: (config: CodebaseSteeringConfig) => {
        const template = get().templates.tech;
        return template
          .replace('{frontend_framework}', config.tech.frontend.framework || 'To be defined')
          .replace('{ui_library}', config.tech.frontend.ui_library || 'To be defined')
          .replace('{state_management}', config.tech.frontend.state_management || 'To be defined')
          .replace('{build_tool}', config.tech.frontend.build_tool || 'To be defined')
          .replace('{testing}', (config.tech.frontend.testing || []).join(', ') || 'To be defined')
          .replace('{backend_framework}', config.tech.backend?.framework || 'Not applicable')
          .replace('{database}', config.tech.backend?.database || 'Not applicable')
          .replace('{api_style}', config.tech.backend?.api_style || 'Not applicable')
          .replace('{authentication}', config.tech.backend?.authentication || 'Not applicable')
          .replace('{deployment}', config.tech.backend?.deployment || 'Not applicable')
          .replace('{package_manager}', config.tech.development_tools.package_manager)
          .replace('{version_control}', config.tech.development_tools.version_control)
          .replace('{code_editor}', config.tech.development_tools.code_editor || 'To be defined')
          .replace('{linting}', (config.tech.development_tools.linting || []).join(', ') || 'To be defined')
          .replace('{formatting}', (config.tech.development_tools.formatting || []).join(', ') || 'To be defined')
          .replace('{node_version}', config.tech.constraints.node_version || 'To be defined')
          .replace('{browser_support}', (config.tech.constraints.browser_support || []).join(', ') || 'Modern browsers')
          .replace('{performance_requirements}', (config.tech.constraints.performance_requirements || []).join(', ') || 'To be defined')
          .replace('{security_requirements}', (config.tech.constraints.security_requirements || []).join(', ') || 'To be defined')
          .replace('{generated_at}', new Date(config.generated_at).toISOString())
          .replace('{codebase_name}', config.codebase_name);
      },

      generateStructureFile: (config: CodebaseSteeringConfig) => {
        const template = get().templates.structure;
        const mainDirs = config.structure.main_directories
          .map(dir => `- **${dir.path}**: ${dir.purpose}${dir.conventions ? '\n  - Conventions: ' + dir.conventions.join(', ') : ''}`)
          .join('\n') || '- To be defined';
        
        const archDecisions = config.structure.architectural_decisions
          .map(decision => `- **${decision.pattern}**: ${decision.reasoning}`)
          .join('\n') || '- To be defined';

        return template
          .replace('{root_directory}', config.structure.root_directory)
          .replace('{main_directories}', mainDirs)
          .replace('{component_naming}', config.structure.file_naming_conventions.components || 'To be defined')
          .replace('{utility_naming}', config.structure.file_naming_conventions.utilities || 'To be defined')
          .replace('{type_naming}', config.structure.file_naming_conventions.types || 'To be defined')
          .replace('{test_naming}', config.structure.file_naming_conventions.tests || 'To be defined')
          .replace('{relative_imports}', config.structure.import_patterns.relative_imports || 'To be defined')
          .replace('{absolute_imports}', config.structure.import_patterns.absolute_imports || 'To be defined')
          .replace('{barrel_exports}', config.structure.import_patterns.barrel_exports ? 'Yes' : 'No')
          .replace('{architectural_decisions}', archDecisions)
          .replace('{generated_at}', new Date(config.generated_at).toISOString())
          .replace('{codebase_name}', config.codebase_name);
      },

      saveFile: (file: Omit<CodebaseSteeringFile, 'id' | 'created_at' | 'updated_at'>) => {
        const id = generateId();
        const now = Date.now();
        
        const newFile: CodebaseSteeringFile = {
          ...file,
          id,
          created_at: now,
          updated_at: now,
        };

        set((state) => ({
          files: {
            ...state.files,
            [id]: newFile,
          },
        }));

        return id;
      },

      updateFile: (id: string, updates: Partial<CodebaseSteeringFile>) => {
        set((state) => {
          const existing = state.files[id];
          if (!existing) return state;

          return {
            files: {
              ...state.files,
              [id]: {
                ...existing,
                ...updates,
                updated_at: Date.now(),
              },
            },
          };
        });
      },

      deleteFile: (id: string) => {
        set((state) => {
          const { [id]: deleted, ...remaining } = state.files;
          return { files: remaining };
        });
      },

      getFilesForCodebase: (codebaseId: string) => {
        const state = get();
        const config = state.configurations[codebaseId];
        if (!config) return [];

        return Object.values(state.files).filter(
          file => file.codebase_path === config.codebase_path
        );
      },

      // Auto-detection utilities (placeholder implementations)
      detectProjectStructure: async (_codebasePath: string) => {
        // This would analyze the actual directory structure
        // For now, return a basic structure
        return {
          root_directory: _codebasePath,
          main_directories: [
            { path: 'src/', purpose: 'Source code', conventions: ['Use clear naming'] },
            { path: 'public/', purpose: 'Static assets', conventions: [] },
          ],
          file_naming_conventions: {
            components: 'PascalCase.tsx',
            utilities: 'camelCase.ts',
            types: 'camelCase.ts',
            tests: '*.test.ts',
          },
          import_patterns: {
            relative_imports: './filename',
            absolute_imports: '@/path/to/file',
            barrel_exports: true,
          },
          architectural_decisions: [
            { pattern: 'Component-based architecture', reasoning: 'Better maintainability and reusability' },
          ],
        };
      },

      detectTechnologyStack: async (_codebasePath: string) => {
        // This would analyze package.json, lock files, etc.
        // For now, return detected values based on known project structure
        return {
          frontend: {
            framework: 'React',
            ui_library: 'shadcn/ui',
            state_management: 'Zustand',
            build_tool: 'Vite',
            testing: ['TypeScript'],
          },
          development_tools: {
            package_manager: 'npm',
            version_control: 'git',
            linting: ['ESLint'],
            formatting: ['Prettier'],
          },
          constraints: {
            node_version: '^18.0.0',
            browser_support: ['Chrome', 'Firefox', 'Safari', 'Edge'],
          },
        };
      },

      suggestProductOverview: async (codebaseName: string, _codebasePath: string) => {
        // This would analyze README, package.json, etc. to suggest product info
        return {
          name: codebaseName,
          purpose: 'To be defined based on codebase analysis',
          target_users: ['Developers', 'End users'],
          key_features: ['Feature 1', 'Feature 2'],
          business_objectives: ['Objective 1', 'Objective 2'],
        };
      },
    }),
    {
      name: 'codebase-steering-store',
      partialize: (state) => ({
        configurations: state.configurations,
        files: state.files,
        current_codebase: state.current_codebase,
        templates: state.templates,
      }),
    }
  )
);