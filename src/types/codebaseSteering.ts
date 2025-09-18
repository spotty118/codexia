/**
 * Types for codebase-specific steering file generation
 * Generates product.md, tech.md, and structure.md files to guide agents
 */

export interface CodebaseSteeringFile {
  id: string;
  filename: string;
  content: string;
  type: 'product' | 'tech' | 'structure';
  created_at: number;
  updated_at: number;
  codebase_path?: string;
  codebase_name?: string;
}

export interface ProductOverview {
  name: string;
  purpose: string;
  target_users: string[];
  key_features: string[];
  business_objectives: string[];
  success_metrics?: string[];
  constraints?: string[];
}

export interface TechnologyStack {
  frontend: {
    framework: string;
    ui_library?: string;
    state_management?: string;
    build_tool?: string;
    testing?: string[];
  };
  backend?: {
    framework: string;
    database?: string;
    api_style?: string;
    authentication?: string;
    deployment?: string;
  };
  development_tools: {
    package_manager: string;
    version_control: string;
    code_editor?: string;
    linting?: string[];
    formatting?: string[];
  };
  constraints: {
    node_version?: string;
    browser_support?: string[];
    performance_requirements?: string[];
    security_requirements?: string[];
  };
}

export interface ProjectStructure {
  root_directory: string;
  main_directories: {
    path: string;
    purpose: string;
    conventions?: string[];
  }[];
  file_naming_conventions: {
    components?: string;
    utilities?: string;
    types?: string;
    tests?: string;
  };
  import_patterns: {
    relative_imports?: string;
    absolute_imports?: string;
    barrel_exports?: boolean;
  };
  architectural_decisions: {
    pattern: string;
    reasoning: string;
  }[];
}

export interface CodebaseSteeringConfig {
  product: ProductOverview;
  tech: TechnologyStack;
  structure: ProjectStructure;
  generated_at: number;
  codebase_path: string;
  codebase_name: string;
}

export interface CodebaseSteeringState {
  configurations: Record<string, CodebaseSteeringConfig>;
  files: Record<string, CodebaseSteeringFile>;
  current_codebase?: string;
  templates: {
    product: string;
    tech: string;
    structure: string;
  };
}

// Template generators
export const DEFAULT_PRODUCT_TEMPLATE = `# Product Overview

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
Codebase: {codebase_name}
`;

export const DEFAULT_TECH_TEMPLATE = `# Technology Stack

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
Codebase: {codebase_name}
`;

export const DEFAULT_STRUCTURE_TEMPLATE = `# Project Structure

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
Codebase: {codebase_name}
`;