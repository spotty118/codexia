import { invoke } from '@tauri-apps/api/core';
import { detectWebFramework, type WebFrameworkInfo } from './webFrameworkDetection';

export interface AppTypeInfo {
  type: 'web' | 'mobile' | 'desktop' | 'backend' | 'library' | 'unknown';
  framework: string;
  detected_at: number;
  workspace_path: string;
  confidence: 'high' | 'medium' | 'low';
  details: {
    web_framework?: WebFrameworkInfo;
    package_manager?: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'pip' | 'cargo' | 'go' | 'maven' | 'gradle';
    primary_language?: string;
    build_tools?: string[];
    testing_frameworks?: string[];
    deployment_hints?: string[];
  };
}

export async function detectAppType(projectPath: string): Promise<AppTypeInfo | null> {
  try {
    const now = Date.now();
    
    // Try to detect web framework first
    const webFramework = await detectWebFramework(projectPath);
    
    // Initialize detection result
    const result: AppTypeInfo = {
      type: 'unknown',
      framework: 'unknown',
      detected_at: now,
      workspace_path: projectPath,
      confidence: 'low',
      details: {}
    };

    // Check for package.json (JavaScript/TypeScript projects)
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const packageJsonContent = await invoke<string>('read_file', { path: packageJsonPath });
      const packageJson = JSON.parse(packageJsonContent);
      
      result.details.package_manager = await detectPackageManager(projectPath);
      result.details.primary_language = 'javascript';
      
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      const scripts = packageJson.scripts || {};
      
      // Detect build tools
      result.details.build_tools = detectBuildTools(dependencies, scripts);
      result.details.testing_frameworks = detectTestingFrameworks(dependencies);
      
      if (webFramework) {
        result.type = 'web';
        result.framework = webFramework.framework;
        result.confidence = 'high';
        result.details.web_framework = webFramework;
      } else if (dependencies['react-native'] || dependencies['@react-native-community/cli']) {
        result.type = 'mobile';
        result.framework = 'react-native';
        result.confidence = 'high';
      } else if (dependencies['electron']) {
        result.type = 'desktop';
        result.framework = 'electron';
        result.confidence = 'high';
      } else if (dependencies['express'] || dependencies['fastify'] || dependencies['koa']) {
        result.type = 'backend';
        result.framework = detectBackendFramework(dependencies);
        result.confidence = 'high';
      } else if (packageJson.main && !dependencies['react'] && !dependencies['vue'] && !dependencies['angular']) {
        result.type = 'library';
        result.framework = 'node';
        result.confidence = 'medium';
      }
      
    } catch (error) {
      // Not a Node.js project, try other languages
    }

    // Check for Python projects
    if (result.type === 'unknown') {
      const pythonInfo = await detectPythonProject(projectPath);
      if (pythonInfo) {
        Object.assign(result, pythonInfo);
      }
    }

    // Check for Rust projects
    if (result.type === 'unknown') {
      const rustInfo = await detectRustProject(projectPath);
      if (rustInfo) {
        Object.assign(result, rustInfo);
      }
    }

    // Check for Go projects
    if (result.type === 'unknown') {
      const goInfo = await detectGoProject(projectPath);
      if (goInfo) {
        Object.assign(result, goInfo);
      }
    }

    // Check for Java projects
    if (result.type === 'unknown') {
      const javaInfo = await detectJavaProject(projectPath);
      if (javaInfo) {
        Object.assign(result, javaInfo);
      }
    }

    return result.type !== 'unknown' ? result : null;
  } catch (error) {
    console.error('Failed to detect app type:', error);
    return null;
  }
}

async function detectPackageManager(projectPath: string): Promise<AppTypeInfo['details']['package_manager']> {
  try {
    // Check for lock files to determine package manager
    const lockFiles = [
      { file: 'bun.lockb', manager: 'bun' as const },
      { file: 'pnpm-lock.yaml', manager: 'pnpm' as const },
      { file: 'yarn.lock', manager: 'yarn' as const },
      { file: 'package-lock.json', manager: 'npm' as const },
    ];

    for (const { file, manager } of lockFiles) {
      try {
        await invoke<string>('read_file', { path: `${projectPath}/${file}` });
        return manager;
      } catch {
        // File doesn't exist, continue
      }
    }
    
    return 'npm'; // Default fallback
  } catch {
    return undefined;
  }
}

function detectBuildTools(dependencies: Record<string, string>, scripts: Record<string, string>): string[] {
  const tools: string[] = [];
  
  if (dependencies['vite'] || dependencies['@vitejs/plugin-react']) tools.push('vite');
  if (dependencies['webpack'] || dependencies['@webpack-cli/core']) tools.push('webpack');
  if (dependencies['rollup']) tools.push('rollup');
  if (dependencies['parcel']) tools.push('parcel');
  if (dependencies['esbuild']) tools.push('esbuild');
  if (dependencies['@tauri-apps/cli'] || dependencies['@tauri-apps/api']) tools.push('tauri');
  if (scripts['build'] && scripts['build'].includes('tsc')) tools.push('typescript');
  
  return tools;
}

function detectTestingFrameworks(dependencies: Record<string, string>): string[] {
  const frameworks: string[] = [];
  
  if (dependencies['jest'] || dependencies['@jest/core']) frameworks.push('jest');
  if (dependencies['vitest']) frameworks.push('vitest');
  if (dependencies['mocha']) frameworks.push('mocha');
  if (dependencies['cypress']) frameworks.push('cypress');
  if (dependencies['playwright'] || dependencies['@playwright/test']) frameworks.push('playwright');
  if (dependencies['@testing-library/react'] || dependencies['@testing-library/vue']) frameworks.push('testing-library');
  
  return frameworks;
}

function detectBackendFramework(dependencies: Record<string, string>): string {
  if (dependencies['express']) return 'express';
  if (dependencies['fastify']) return 'fastify';
  if (dependencies['koa']) return 'koa';
  if (dependencies['nestjs'] || dependencies['@nestjs/core']) return 'nestjs';
  if (dependencies['apollo-server'] || dependencies['apollo-server-express']) return 'apollo';
  return 'node';
}

async function detectPythonProject(projectPath: string): Promise<Partial<AppTypeInfo> | null> {
  try {
    // Check for Python files
    const files = ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'];
    
    for (const file of files) {
      try {
        const content = await invoke<string>('read_file', { path: `${projectPath}/${file}` });
        
        // Analyze Python project type
        if (content.includes('django')) {
          return {
            type: 'web',
            framework: 'django',
            confidence: 'high',
            details: { primary_language: 'python', package_manager: 'pip' }
          };
        }
        if (content.includes('flask')) {
          return {
            type: 'web',
            framework: 'flask',
            confidence: 'high',
            details: { primary_language: 'python', package_manager: 'pip' }
          };
        }
        if (content.includes('fastapi')) {
          return {
            type: 'backend',
            framework: 'fastapi',
            confidence: 'high',
            details: { primary_language: 'python', package_manager: 'pip' }
          };
        }
        
        return {
          type: 'library',
          framework: 'python',
          confidence: 'medium',
          details: { primary_language: 'python', package_manager: 'pip' }
        };
      } catch {
        // File doesn't exist, continue
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

async function detectRustProject(projectPath: string): Promise<Partial<AppTypeInfo> | null> {
  try {
    const cargoToml = await invoke<string>('read_file', { path: `${projectPath}/Cargo.toml` });
    
    if (cargoToml.includes('tauri')) {
      return {
        type: 'desktop',
        framework: 'tauri',
        confidence: 'high',
        details: { primary_language: 'rust', package_manager: 'cargo' }
      };
    }
    
    if (cargoToml.includes('[[bin]]')) {
      return {
        type: 'backend',
        framework: 'rust',
        confidence: 'medium',
        details: { primary_language: 'rust', package_manager: 'cargo' }
      };
    }
    
    return {
      type: 'library',
      framework: 'rust',
      confidence: 'medium',
      details: { primary_language: 'rust', package_manager: 'cargo' }
    };
  } catch {
    return null;
  }
}

async function detectGoProject(projectPath: string): Promise<Partial<AppTypeInfo> | null> {
  try {
    await invoke<string>('read_file', { path: `${projectPath}/go.mod` });
    
    return {
      type: 'backend',
      framework: 'go',
      confidence: 'medium',
      details: { primary_language: 'go', package_manager: 'go' }
    };
  } catch {
    return null;
  }
}

async function detectJavaProject(projectPath: string): Promise<Partial<AppTypeInfo> | null> {
  try {
    const files = ['pom.xml', 'build.gradle', 'build.gradle.kts'];
    
    for (const file of files) {
      try {
        const content = await invoke<string>('read_file', { path: `${projectPath}/${file}` });
        
        const isMaven = file === 'pom.xml';
        
        if (content.includes('spring-boot')) {
          return {
            type: 'backend',
            framework: 'spring-boot',
            confidence: 'high',
            details: { 
              primary_language: 'java', 
              package_manager: isMaven ? 'maven' : 'gradle' 
            }
          };
        }
        
        return {
          type: 'backend',
          framework: 'java',
          confidence: 'medium',
          details: { 
            primary_language: 'java', 
            package_manager: isMaven ? 'maven' : 'gradle' 
          }
        };
      } catch {
        // File doesn't exist, continue
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function getAppTypeDisplayName(appType: AppTypeInfo): string {
  const { type, framework } = appType;
  
  if (type === 'web') {
    return `${framework.charAt(0).toUpperCase() + framework.slice(1)} Web App`;
  }
  if (type === 'mobile') {
    return `${framework.charAt(0).toUpperCase() + framework.slice(1)} Mobile App`;
  }
  if (type === 'desktop') {
    return `${framework.charAt(0).toUpperCase() + framework.slice(1)} Desktop App`;
  }
  if (type === 'backend') {
    return `${framework.charAt(0).toUpperCase() + framework.slice(1)} Backend Service`;
  }
  if (type === 'library') {
    return `${framework.charAt(0).toUpperCase() + framework.slice(1)} Library`;
  }
  
  return 'Unknown Project Type';
}

export function getAppTypeFocusGuidance(appType: AppTypeInfo): string[] {
  const guidance: string[] = [];
  
  switch (appType.type) {
    case 'web':
      guidance.push('Focus on UI/UX improvements and user experience');
      guidance.push('Consider performance optimization and accessibility');
      guidance.push('Think about responsive design and cross-browser compatibility');
      break;
    case 'mobile':
      guidance.push('Focus on mobile-specific UX patterns and performance');
      guidance.push('Consider platform-specific guidelines (iOS/Android)');
      guidance.push('Think about offline functionality and push notifications');
      break;
    case 'desktop':
      guidance.push('Focus on native desktop patterns and workflows');
      guidance.push('Consider system integration and file management');
      guidance.push('Think about cross-platform compatibility');
      break;
    case 'backend':
      guidance.push('Focus on API design and data consistency');
      guidance.push('Consider scalability and performance optimization');
      guidance.push('Think about security and error handling');
      break;
    case 'library':
      guidance.push('Focus on API design and developer experience');
      guidance.push('Consider documentation and examples');
      guidance.push('Think about backwards compatibility and versioning');
      break;
  }
  
  return guidance;
}