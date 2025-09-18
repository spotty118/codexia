/**
 * Auto-setup utility for spec steering files and agent reminders
 */

import { useCodebaseSteeringStore } from '@/stores/CodebaseSteeringStore';
import { useAgentSteeringStore } from '@/stores/AgentSteeringStore';

export interface AutoSetupOptions {
  codebasePath: string;
  codebaseName?: string;
  enableReminders?: boolean;
  generateFiles?: boolean;
}

export interface AutoSetupResult {
  success: boolean;
  configurationId?: string;
  generatedFiles?: string[];
  enabledReminders?: string[];
  errors?: string[];
}

/**
 * Automatically sets up spec steering files and agent reminders for a codebase
 */
export async function autoSetupSteeringForCodebase(options: AutoSetupOptions): Promise<AutoSetupResult> {
  const {
    codebasePath,
    codebaseName = 'Current Project',
    enableReminders = true,
    generateFiles = true
  } = options;

  const errors: string[] = [];
  const result: AutoSetupResult = { success: false };

  try {
    // Get store instances
    const codebaseStore = useCodebaseSteeringStore.getState();
    const agentStore = useAgentSteeringStore.getState();

    // Step 1: Create or get existing configuration
    let configId = codebaseStore.current_codebase;
    
    if (!configId) {
      configId = codebaseStore.createConfiguration(codebaseName, codebasePath);
      console.log('Created new codebase configuration:', configId);
    }
    
    result.configurationId = configId;

    // Step 2: Generate and save steering files if requested
    if (generateFiles) {
      try {
        const fileResult = await codebaseStore.autoGenerateForCurrentProject();
        
        if (fileResult.success) {
          result.generatedFiles = fileResult.files;
          console.log('Successfully generated steering files:', fileResult.files);
        } else {
          errors.push(...(fileResult.errors || ['Failed to generate steering files']));
        }
      } catch (error) {
        const errorMsg = `File generation failed: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Step 3: Enable agent reminders if requested
    if (enableReminders) {
      try {
        agentStore.enableSteeringFileReminders();
        result.enabledReminders = ['Coding Task Focus Reminder', 'Spec File Adherence Check', 'Auto-Generate Steering Files'];
        console.log('Enabled agent steering reminders');
      } catch (error) {
        const errorMsg = `Failed to enable reminders: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    result.success = errors.length === 0;
    result.errors = errors.length > 0 ? errors : undefined;

    return result;
  } catch (error) {
    const errorMsg = `Auto-setup failed: ${error}`;
    console.error(errorMsg);
    return {
      success: false,
      errors: [errorMsg]
    };
  }
}

/**
 * Quick setup function that can be called when opening a project
 */
export async function quickSetupSteering(projectPath: string, projectName?: string): Promise<AutoSetupResult> {
  return autoSetupSteeringForCodebase({
    codebasePath: projectPath,
    codebaseName: projectName || extractProjectNameFromPath(projectPath),
    enableReminders: true,
    generateFiles: true
  });
}

/**
 * Extract project name from path
 */
function extractProjectNameFromPath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  return parts[parts.length - 1] || 'Project';
}

/**
 * Check if steering files already exist
 */
export async function checkSteeringFilesExist(projectPath: string): Promise<{ product: boolean; tech: boolean; structure: boolean }> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    
    const filesToCheck = ['product.md', 'tech.md', 'structure.md'];
    const results = await Promise.all(
      filesToCheck.map(async (filename) => {
        try {
          await invoke('read_file', { filePath: `${projectPath}/${filename}` });
          return true;
        } catch {
          return false;
        }
      })
    );

    return {
      product: results[0],
      tech: results[1],
      structure: results[2]
    };
  } catch (error) {
    console.error('Failed to check steering files:', error);
    return { product: false, tech: false, structure: false };
  }
}