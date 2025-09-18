import { invokeWithDefault } from '@/utils/tauri';
import { ModelProvider, Profile, ProviderConfig } from '@/types/config';

export class ConfigService {
  static async getProviderConfig(providerName: string): Promise<ProviderConfig | null> {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, returning null for provider config');
        return null;
      }
      
      const result = await invoke<[ModelProvider, Profile | null] | null>('get_provider_config', {
        providerName
      });
      
      if (result) {
        const [provider, profile] = result;
        return {
          provider,
          profile: profile || undefined
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get provider config for ${providerName}:`, error);
      return null;
    }
  }

  static async getProfileConfig(profileName: string): Promise<Profile | null> {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, returning null for profile config');
        return null;
      }
      
      const result = await invoke<Profile | null>('get_profile_config', {
        profileName
      });
      
      return result;
    } catch (error) {
      console.error(`Failed to get profile config for ${profileName}:`, error);
      return null;
    }
  }

  static async getAllProviders(): Promise<Record<string, ModelProvider>> {
    return await invokeWithDefault('read_model_providers', {});
  }

  static async getAllProfiles(): Promise<Record<string, Profile>> {
    return await invokeWithDefault('read_profiles', {});
  }

  // Helper method to get configuration for commonly used providers
  static async getCommonProviders() {
    const providers = ['google', 'openrouter', 'openai', 'anthropic'];
    const configs: Record<string, ProviderConfig> = {};
    
    for (const providerName of providers) {
      const config = await this.getProviderConfig(providerName);
      if (config) {
        configs[providerName] = config;
      }
    }
    
    return configs;
  }

  // Write methods for updating configuration
  static async updateProfileModel(profileName: string, newModel: string): Promise<void> {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, skipping profile model update');
        return;
      }
      
      await invoke('update_profile_model', {
        profileName,
        newModel
      });
    } catch (error) {
      console.error(`Failed to update profile model for ${profileName}:`, error);
      throw new Error(`Failed to update profile model: ${error}`);
    }
  }

  static async addOrUpdateProfile(profileName: string, profile: Profile): Promise<void> {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, skipping profile add/update');
        return;
      }
      
      await invoke('add_or_update_profile', {
        profileName,
        profile
      });
    } catch (error) {
      console.error(`Failed to add/update profile ${profileName}:`, error);
      throw new Error(`Failed to add/update profile: ${error}`);
    }
  }

  static async deleteProfile(profileName: string): Promise<void> {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, skipping profile deletion');
        return;
      }
      
      await invoke('delete_profile', {
        profileName
      });
    } catch (error) {
      console.error(`Failed to delete profile ${profileName}:`, error);
      throw new Error(`Failed to delete profile: ${error}`);
    }
  }

  static async addOrUpdateModelProvider(providerName: string, provider: ModelProvider): Promise<void> {
    try {
      if (!isTauriAvailable()) {
        console.warn('Tauri API not available, skipping model provider add/update');
        return;
      }
      
      await invoke('add_or_update_model_provider', {
        providerName,
        provider
      });
    } catch (error) {
      console.error(`Failed to add/update model provider ${providerName}:`, error);
      throw new Error(`Failed to add/update model provider: ${error}`);
    }
  }
}