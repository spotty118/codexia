import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * Check if Tauri API is available
 */
export const isTauriAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.__TAURI__;
};

/**
 * Safe wrapper around Tauri's invoke function that checks for availability
 */
export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isTauriAvailable()) {
    console.warn(`Tauri API not available, skipping command: ${command}`);
    return null;
  }

  try {
    return await tauriInvoke<T>(command, args);
  } catch (error) {
    console.error(`Failed to execute command ${command}:`, error);
    throw error;
  }
}

/**
 * Safe wrapper that returns a default value instead of null when Tauri is unavailable
 */
export async function invokeWithDefault<T>(command: string, defaultValue: T, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriAvailable()) {
    console.warn(`Tauri API not available, returning default for command: ${command}`);
    return defaultValue;
  }

  try {
    return await tauriInvoke<T>(command, args);
  } catch (error) {
    console.error(`Failed to execute command ${command}, returning default:`, error);
    return defaultValue;
  }
}