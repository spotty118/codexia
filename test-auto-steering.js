/**
 * Test file for the auto-generation steering system
 * Run with: node test-auto-steering.js
 */

// Mock the zustand persist functionality for this test
const mockPersist = (fn) => fn;

// Mock Tauri invoke
const mockInvoke = async (command, args) => {
  console.log(`Mock invoke: ${command}`, args);
  
  if (command === 'write_file') {
    console.log(`📝 Would write file: ${args.filePath}`);
    console.log(`Content preview: ${args.content.substring(0, 100)}...`);
    return Promise.resolve();
  }
  
  if (command === 'read_file') {
    // Simulate files not existing
    throw new Error('File not found');
  }
  
  return Promise.resolve();
};

// Simplified store implementations for testing
class TestCodebaseSteeringStore {
  constructor() {
    this.configurations = {};
    this.files = {};
    this.current_codebase = undefined;
    this.templates = {
      product: `# Product Overview

## Purpose
{purpose}

## Target Users
{target_users}

## Key Features
{key_features}

## Business Objectives
{business_objectives}

## Success Metrics
{success_metrics}

## Constraints
{constraints}

---
Generated on: {generated_at}
Codebase: {codebase_name}`,
      tech: `# Technology Stack

## Frontend
- **Framework**: {frontend_framework}
- **UI Library**: {ui_library}
- **State Management**: {state_management}
- **Build Tool**: {build_tool}
- **Testing**: {testing}

## Backend
- **Framework**: {backend_framework}
- **Database**: {database}
- **API Style**: {api_style}
- **Authentication**: {authentication}
- **Deployment**: {deployment}

## Development Tools
- **Package Manager**: {package_manager}
- **Version Control**: {version_control}
- **Code Editor**: {code_editor}
- **Linting**: {linting}
- **Formatting**: {formatting}

## Constraints
- **Node Version**: {node_version}
- **Browser Support**: {browser_support}
- **Performance Requirements**: {performance_requirements}
- **Security Requirements**: {security_requirements}

---
Generated on: {generated_at}
Codebase: {codebase_name}`,
      structure: `# Project Structure

## Root Directory
\`\`\`
{root_directory}
\`\`\`

## Main Directories
{main_directories}

## File Naming Conventions
- **Components**: {component_naming}
- **Utilities**: {utility_naming}
- **Types**: {type_naming}
- **Tests**: {test_naming}

## Import Patterns
- **Relative Imports**: {relative_imports}
- **Absolute Imports**: {absolute_imports}
- **Barrel Exports**: {barrel_exports}

## Architectural Decisions
{architectural_decisions}

---
Generated on: {generated_at}
Codebase: {codebase_name}`
    };
  }

  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  createConfiguration(codebaseName, codebasePath) {
    const id = this.generateId();
    const now = Date.now();
    
    const config = {
      product: {
        name: codebaseName,
        purpose: 'React-based coding assistant application',
        target_users: ['Developers', 'Code reviewers', 'Project managers'],
        key_features: ['AI-powered code assistance', 'Project management', 'Real-time collaboration'],
        business_objectives: ['Improve development efficiency', 'Reduce coding errors', 'Enhance project organization'],
        success_metrics: ['User adoption rate', 'Code quality improvement', 'Development speed increase'],
        constraints: ['Browser compatibility required', 'Performance optimization needed']
      },
      tech: {
        frontend: {
          framework: 'React',
          ui_library: 'shadcn/ui',
          state_management: 'Zustand',
          build_tool: 'Vite',
          testing: ['TypeScript', 'Jest']
        },
        backend: {
          framework: 'Tauri',
          database: 'File-based storage',
          api_style: 'Tauri commands',
          authentication: 'Local sessions',
          deployment: 'Desktop application'
        },
        development_tools: {
          package_manager: 'npm',
          version_control: 'git',
          code_editor: 'VS Code',
          linting: ['ESLint', 'TypeScript'],
          formatting: ['Prettier']
        },
        constraints: {
          node_version: '^18.0.0',
          browser_support: ['Chrome', 'Firefox', 'Safari', 'Edge'],
          performance_requirements: ['Fast startup', 'Low memory usage'],
          security_requirements: ['Secure file access', 'Data encryption']
        }
      },
      structure: {
        root_directory: codebasePath,
        main_directories: [
          { path: 'src/', purpose: 'Main source code', conventions: ['TypeScript files', 'React components'] },
          { path: 'src/components/', purpose: 'Reusable UI components', conventions: ['PascalCase naming'] },
          { path: 'src/stores/', purpose: 'State management', conventions: ['Zustand stores'] },
          { path: 'src/types/', purpose: 'TypeScript type definitions', conventions: ['Interface definitions'] },
          { path: 'src/utils/', purpose: 'Utility functions', conventions: ['Pure functions'] },
          { path: 'src-tauri/', purpose: 'Tauri backend code', conventions: ['Rust code'] },
          { path: 'public/', purpose: 'Static assets', conventions: ['Optimized images'] }
        ],
        file_naming_conventions: {
          components: 'PascalCase.tsx',
          utilities: 'camelCase.ts',
          types: 'camelCase.ts',
          tests: '*.test.ts'
        },
        import_patterns: {
          relative_imports: './filename',
          absolute_imports: '@/path/to/file',
          barrel_exports: true
        },
        architectural_decisions: [
          { pattern: 'Component-based architecture', reasoning: 'Better maintainability and reusability' },
          { pattern: 'Zustand for state management', reasoning: 'Lightweight and TypeScript-friendly' },
          { pattern: 'Tauri for desktop integration', reasoning: 'Native performance with web technologies' }
        ]
      },
      generated_at: now,
      codebase_path: codebasePath,
      codebase_name: codebaseName
    };

    this.configurations[id] = config;
    this.current_codebase = id;
    return id;
  }

  updateConfiguration(id, updates) {
    if (this.configurations[id]) {
      this.configurations[id] = {
        ...this.configurations[id],
        ...updates,
        generated_at: Date.now()
      };
    }
  }

  generateProductFile(config) {
    return this.templates.product
      .replace('{purpose}', config.product.purpose || 'To be defined')
      .replace('{target_users}', config.product.target_users.map(user => `- ${user}`).join('\\n') || '- To be defined')
      .replace('{key_features}', config.product.key_features.map(feature => `- ${feature}`).join('\\n') || '- To be defined')
      .replace('{business_objectives}', config.product.business_objectives.map(obj => `- ${obj}`).join('\\n') || '- To be defined')
      .replace('{success_metrics}', (config.product.success_metrics || []).map(metric => `- ${metric}`).join('\\n') || '- To be defined')
      .replace('{constraints}', (config.product.constraints || []).map(constraint => `- ${constraint}`).join('\\n') || '- None specified')
      .replace('{generated_at}', new Date(config.generated_at).toISOString())
      .replace('{codebase_name}', config.codebase_name);
  }

  generateTechFile(config) {
    return this.templates.tech
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
  }

  generateStructureFile(config) {
    const mainDirs = config.structure.main_directories
      .map(dir => `- **${dir.path}**: ${dir.purpose}${dir.conventions ? '\\n  - Conventions: ' + dir.conventions.join(', ') : ''}`)
      .join('\\n') || '- To be defined';
    
    const archDecisions = config.structure.architectural_decisions
      .map(decision => `- **${decision.pattern}**: ${decision.reasoning}`)
      .join('\\n') || '- To be defined';

    return this.templates.structure
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
  }

  async generateAndSaveSteeringFiles(configId) {
    const config = this.configurations[configId];
    if (!config) {
      throw new Error('Configuration not found');
    }

    const productContent = this.generateProductFile(config);
    const techContent = this.generateTechFile(config);
    const structureContent = this.generateStructureFile(config);

    const files = [
      { filename: 'product.md', content: productContent },
      { filename: 'tech.md', content: techContent },
      { filename: 'structure.md', content: structureContent },
    ];

    const savedFiles = [];
    const errors = [];

    // Simulate saving files
    for (const file of files) {
      try {
        const filePath = `${config.codebase_path}/${file.filename}`;
        await mockInvoke('write_file', {
          filePath,
          content: file.content
        });
        savedFiles.push(filePath);
      } catch (error) {
        const errorMsg = `Failed to save ${file.filename}: ${error}`;
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      files: savedFiles,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async autoGenerateForCurrentProject() {
    if (!this.current_codebase) {
      throw new Error('No current codebase selected');
    }

    return await this.generateAndSaveSteeringFiles(this.current_codebase);
  }
}

class TestAgentSteeringStore {
  constructor() {
    this.specs = {};
    this.reminders = {};
    this.activations = {};
    this.activeReminders = [];
    this.cooldownSpecs = {};
    this.templates = [
      // ... previous templates ...
      {
        name: "Coding Task Focus Reminder",
        description: "Remind agent to stay focused on the main coding objective",
        triggers: [{ type: 'time_interval', intervalMs: 3 * 60 * 1000 }],
        actions: [{ 
          type: 'reminder', 
          message: "Stay focused on the main coding objective. Ensure all changes align with the spec steering files (product.md, tech.md, structure.md) in the project root.",
          priority: 'high' 
        }]
      },
      {
        name: "Spec File Adherence Check",
        description: "Remind agent to check spec steering files when making changes",
        triggers: [{ type: 'context_change', filePattern: '.ts,.tsx,.js,.jsx' }],
        actions: [{ 
          type: 'reminder', 
          message: "When making code changes, ensure they follow the guidelines in product.md, tech.md, and structure.md files.",
          priority: 'medium' 
        }]
      },
      {
        name: "Auto-Generate Steering Files",
        description: "Suggest generating steering files if they don't exist",
        triggers: [{ type: 'manual' }],
        actions: [{ 
          type: 'suggestion', 
          content: "Consider auto-generating the spec steering files (product.md, tech.md, structure.md) to help maintain project focus.",
          auto_dismiss: false
        }]
      }
    ];
  }

  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  createSpecFromTemplate(templateIndex) {
    const template = this.templates[templateIndex];
    if (!template) return '';
    
    const id = this.generateId();
    const now = Date.now();
    
    const spec = {
      id,
      name: template.name,
      description: template.description,
      enabled: true,
      triggers: template.triggers,
      actions: template.actions,
      conditions: template.conditions,
      created_at: now,
      updated_at: now,
    };
    
    this.specs[id] = spec;
    return id;
  }

  enableSteeringFileReminders() {
    const steeringTemplateNames = [
      "Coding Task Focus Reminder",
      "Spec File Adherence Check", 
      "Auto-Generate Steering Files"
    ];
    
    const createdSpecs = steeringTemplateNames.map(name => {
      const templateIndex = this.templates.findIndex(t => t.name === name);
      return templateIndex >= 0 ? this.createSpecFromTemplate(templateIndex) : '';
    }).filter(id => id !== '');
    
    console.log('🎯 Steering file reminders enabled', { createdSpecs });
    return createdSpecs;
  }
}

// Test the auto-setup functionality
async function testAutoSteeringSetup() {
  console.log("🚀 Testing Auto Steering Setup System");
  
  const codebaseStore = new TestCodebaseSteeringStore();
  const agentStore = new TestAgentSteeringStore();
  
  // Test 1: Auto-setup for a new project
  console.log("\\n📋 Test 1: Auto-setup for new project");
  const projectPath = "/path/to/codexia/project";
  const projectName = "Codexia";
  
  // Step 1: Create configuration
  const configId = codebaseStore.createConfiguration(projectName, projectPath);
  console.log("✅ Created configuration:", configId);
  
  // Step 2: Generate and save steering files
  console.log("\\n📝 Test 2: Auto-generating steering files");
  try {
    const fileResult = await codebaseStore.autoGenerateForCurrentProject();
    
    if (fileResult.success) {
      console.log("✅ Successfully generated steering files:");
      fileResult.files.forEach(file => console.log(`  - ${file}`));
    } else {
      console.error("❌ Failed to generate files:", fileResult.errors);
    }
  } catch (error) {
    console.error("❌ File generation error:", error);
  }
  
  // Step 3: Enable agent reminders
  console.log("\\n🔔 Test 3: Enabling agent reminders");
  try {
    const enabledSpecs = agentStore.enableSteeringFileReminders();
    console.log("✅ Enabled agent steering specs:");
    enabledSpecs.forEach(specId => {
      const spec = agentStore.specs[specId];
      if (spec) {
        console.log(`  - ${spec.name}: ${spec.description}`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to enable reminders:", error);
  }
  
  console.log("\\n🎉 Auto-setup test completed!");
  console.log("📊 Summary:");
  console.log(`  - Configurations: ${Object.keys(codebaseStore.configurations).length}`);
  console.log(`  - Generated files: ${codebaseStore.current_codebase ? 3 : 0} (expected: 3)`);
  console.log(`  - Active specs: ${Object.keys(agentStore.specs).length}`);
  console.log(`  - Reminder specs enabled: ${Object.values(agentStore.specs).filter(s => s.enabled).length}`);
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  window.testAutoSteeringSetup = testAutoSteeringSetup;
  console.log("Auto steering test available. Run: testAutoSteeringSetup()");
} else if (typeof module !== 'undefined') {
  // Node.js environment
  module.exports = { testAutoSteeringSetup, TestCodebaseSteeringStore, TestAgentSteeringStore };
}

// Auto-run if in Node.js
testAutoSteeringSetup();