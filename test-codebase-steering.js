/**
 * Test file for the codebase steering functionality
 * Run with: node test-codebase-steering.js
 */

// Mock the zustand persist functionality for this test
const mockPersist = (fn) => fn;

// Simplified store implementation for testing
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

---
Generated on: {generated_at}
Codebase: {codebase_name}
`,
      tech: `# Technology Stack

## Frontend
- **Framework**: {frontend_framework}
- **UI Library**: {ui_library}
- **State Management**: {state_management}

## Development Tools
- **Package Manager**: {package_manager}
- **Version Control**: {version_control}

---
Generated on: {generated_at}
Codebase: {codebase_name}
`,
      structure: `# Project Structure

## Root Directory
\`\`\`
{root_directory}
\`\`\`

## Main Directories
{main_directories}

---
Generated on: {generated_at}
Codebase: {codebase_name}
`
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
        purpose: 'Test product purpose',
        target_users: ['Developers', 'End users'],
        key_features: ['Feature 1', 'Feature 2'],
        business_objectives: ['Objective 1', 'Objective 2'],
      },
      tech: {
        frontend: {
          framework: 'React',
          ui_library: 'shadcn/ui',
          state_management: 'Zustand',
        },
        development_tools: {
          package_manager: 'npm',
          version_control: 'git',
        },
        constraints: {},
      },
      structure: {
        root_directory: codebasePath,
        main_directories: [
          { path: 'src/', purpose: 'Source code' },
          { path: 'public/', purpose: 'Static assets' },
        ],
        file_naming_conventions: {},
        import_patterns: {},
        architectural_decisions: [],
      },
      generated_at: now,
      codebase_path: codebasePath,
      codebase_name: codebaseName,
    };

    this.configurations[id] = config;
    this.current_codebase = id;
    return id;
  }

  generateProductFile(config) {
    return this.templates.product
      .replace('{purpose}', config.product.purpose)
      .replace('{target_users}', config.product.target_users.map(user => `- ${user}`).join('\n'))
      .replace('{key_features}', config.product.key_features.map(feature => `- ${feature}`).join('\n'))
      .replace('{business_objectives}', config.product.business_objectives.map(obj => `- ${obj}`).join('\n'))
      .replace('{generated_at}', new Date(config.generated_at).toISOString())
      .replace('{codebase_name}', config.codebase_name);
  }

  generateTechFile(config) {
    return this.templates.tech
      .replace('{frontend_framework}', config.tech.frontend.framework)
      .replace('{ui_library}', config.tech.frontend.ui_library || 'Not specified')
      .replace('{state_management}', config.tech.frontend.state_management || 'Not specified')
      .replace('{package_manager}', config.tech.development_tools.package_manager)
      .replace('{version_control}', config.tech.development_tools.version_control)
      .replace('{generated_at}', new Date(config.generated_at).toISOString())
      .replace('{codebase_name}', config.codebase_name);
  }

  generateStructureFile(config) {
    const mainDirs = config.structure.main_directories
      .map(dir => `- **${dir.path}**: ${dir.purpose}`)
      .join('\n');

    return this.templates.structure
      .replace('{root_directory}', config.structure.root_directory)
      .replace('{main_directories}', mainDirs)
      .replace('{generated_at}', new Date(config.generated_at).toISOString())
      .replace('{codebase_name}', config.codebase_name);
  }

  async generateSteeringFiles(configId) {
    const config = this.configurations[configId];
    if (!config) {
      throw new Error('Configuration not found');
    }

    const productContent = this.generateProductFile(config);
    const techContent = this.generateTechFile(config);
    const structureContent = this.generateStructureFile(config);

    return {
      product: productContent,
      tech: techContent,
      structure: structureContent,
    };
  }
}

// Test function
async function testCodebaseSteeringGeneration() {
  console.log("🎯 Testing Codebase Steering File Generation System");
  
  const store = new TestCodebaseSteeringStore();
  
  // Test 1: Create configuration
  console.log("\n📋 Test 1: Creating codebase configuration");
  const configId = store.createConfiguration("Test Project", "/path/to/test/project");
  console.log("Created configuration with ID:", configId);
  console.log("Configuration:", JSON.stringify(store.configurations[configId], null, 2));
  
  // Test 2: Generate steering files
  console.log("\n📝 Test 2: Generating steering files");
  try {
    const files = await store.generateSteeringFiles(configId);
    
    console.log("\n--- Generated product.md ---");
    console.log(files.product);
    
    console.log("\n--- Generated tech.md ---");
    console.log(files.tech);
    
    console.log("\n--- Generated structure.md ---");
    console.log(files.structure);
    
    console.log("\n✅ All steering files generated successfully!");
    console.log("📁 Files ready for download:");
    console.log("  - product.md");
    console.log("  - tech.md");
    console.log("  - structure.md");
    
  } catch (error) {
    console.error("❌ Error generating files:", error);
  }
  
  console.log("\n🎉 Test completed!");
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  window.testCodebaseSteeringGeneration = testCodebaseSteeringGeneration;
  console.log("Codebase steering test available. Run: testCodebaseSteeringGeneration()");
} else if (typeof module !== 'undefined') {
  // Node.js environment
  module.exports = { testCodebaseSteeringGeneration, TestCodebaseSteeringStore };
}

// Auto-run if in Node.js
testCodebaseSteeringGeneration();