import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AgentSteeringSpec, 
  AgentReminder, 
  SteeringActivation, 
  AgentSteeringState,
  SteeringTrigger,
  SteeringAction
} from '@/types/agentSteering';
import { DEFAULT_STEERING_TEMPLATES } from '@/types/agentSteering';
import { detectAppType, type AppTypeInfo } from '@/utils/appTypeDetection';
import { useFolderStore } from '@/stores/FolderStore';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

interface AgentSteeringStore extends AgentSteeringState {
  // Spec management
  createSpec: (name: string, description?: string, autoDetectAppType?: boolean) => Promise<string>;
  updateSpec: (id: string, updates: Partial<AgentSteeringSpec>) => void;
  deleteSpec: (id: string) => void;
  toggleSpec: (id: string) => void;
  createSpecFromTemplate: (templateIndex: number, autoDetectAppType?: boolean) => Promise<string>;
  
  // App type utilities
  detectAndAttachAppType: (specId: string, workspacePath?: string) => Promise<void>;
  getAppTypeFocusedSpecs: (appType?: string) => AgentSteeringSpec[];
  
  // Reminder management
  createReminder: (specId: string, message: string, priority: AgentReminder['priority'], scheduledFor?: number) => string;
  dismissReminder: (id: string) => void;
  getActiveReminders: () => AgentReminder[];
  cleanupExpiredReminders: () => void;
  
  // Activation tracking
  recordActivation: (specId: string, trigger: SteeringTrigger, action: SteeringAction, conversationId?: string, messageId?: string) => string;
  getSpecActivations: (specId: string) => SteeringActivation[];
  
  // Evaluation methods
  evaluateSpecs: (context: EvaluationContext) => SteeringActivation[];
  shouldActivateSpec: (spec: AgentSteeringSpec, context: EvaluationContext) => boolean;
  
  // Utility methods
  getSpecsForConversation: (conversationId?: string) => AgentSteeringSpec[];
  isSpecInCooldown: (specId: string) => boolean;
  getSpecActivationCount: (specId: string) => number;
}

interface EvaluationContext {
  conversationId?: string;
  messageId?: string;
  conversationLength: number;
  contextFilesCount: number;
  lastMessageTimestamp: number;
  currentTimestamp: number;
  modelType?: string;
  workspacePath?: string;
  lastPlanStep?: { status: 'pending' | 'in_progress' | 'completed'; step: string };
  recentContextChange?: { filePattern?: string; timestamp: number };
}

export const useAgentSteeringStore = create<AgentSteeringStore>()(
  persist(
    (set, get) => ({
      specs: {},
      reminders: {},
      activations: {},
      activeReminders: [],
      cooldownSpecs: {},

      createSpec: async (name: string, description?: string, autoDetectAppType: boolean = true) => {
        const id = generateId();
        const now = Date.now();
        
        // Get current workspace for app type detection
        let appTypeInfo: AppTypeInfo | null = null;
        let workspace: string | null = null;
        
        if (autoDetectAppType) {
          try {
            // Access folder store to get current workspace
            workspace = useFolderStore.getState().currentFolder;
            if (workspace) {
              appTypeInfo = await detectAppType(workspace);
            }
          } catch (error) {
            console.warn('Failed to detect app type:', error);
          }
        }
        
        const spec: AgentSteeringSpec = {
          id,
          name,
          description,
          enabled: true,
          triggers: [],
          actions: [],
          created_at: now,
          updated_at: now,
          app_type: appTypeInfo ? {
            framework: appTypeInfo.framework,
            detected_at: appTypeInfo.detected_at,
            workspace_path: appTypeInfo.workspace_path,
            confidence: appTypeInfo.confidence,
            details: appTypeInfo.details,
          } : undefined,
        };
        
        set(state => ({
          specs: { ...state.specs, [id]: spec }
        }));
        
        return id;
      },

      updateSpec: (id: string, updates: Partial<AgentSteeringSpec>) => {
        set(state => {
          if (!state.specs[id]) return state;
          
          return {
            specs: {
              ...state.specs,
              [id]: {
                ...state.specs[id],
                ...updates,
                updated_at: Date.now(),
              }
            }
          };
        });
      },

      deleteSpec: (id: string) => {
        set(state => {
          const { [id]: deleted, ...remainingSpecs } = state.specs;
          return { specs: remainingSpecs };
        });
      },

      toggleSpec: (id: string) => {
        const { updateSpec } = get();
        const spec = get().specs[id];
        if (spec) {
          updateSpec(id, { enabled: !spec.enabled });
        }
      },

      createSpecFromTemplate: async (templateIndex: number, autoDetectAppType: boolean = true) => {
        const template = DEFAULT_STEERING_TEMPLATES[templateIndex];
        if (!template) return '';
        
        const { createSpec, updateSpec } = get();
        const id = await createSpec(template.name, template.description, autoDetectAppType);
        
        updateSpec(id, {
          triggers: template.triggers,
          actions: template.actions,
          conditions: template.conditions,
        });
        
        return id;
      },

      detectAndAttachAppType: async (specId: string, workspacePath?: string) => {
        try {
          const workspace = workspacePath || useFolderStore.getState().currentFolder;
          if (!workspace) return;
          
          const appTypeInfo = await detectAppType(workspace);
          if (appTypeInfo) {
            const { updateSpec } = get();
            updateSpec(specId, {
              app_type: {
                framework: appTypeInfo.framework,
                detected_at: appTypeInfo.detected_at,
                workspace_path: appTypeInfo.workspace_path,
                confidence: appTypeInfo.confidence,
                details: appTypeInfo.details,
              }
            });
          }
        } catch (error) {
          console.warn('Failed to detect and attach app type:', error);
        }
      },

      getAppTypeFocusedSpecs: (appType?: string) => {
        const state = get();
        if (!appType) {
          return Object.values(state.specs);
        }
        
        return Object.values(state.specs).filter(spec => 
          spec.app_type?.framework === appType || 
          spec.app_type?.details?.primary_language === appType
        );
      },

      createReminder: (specId: string, message: string, priority: AgentReminder['priority'], scheduledFor?: number) => {
        const id = generateId();
        const now = Date.now();
        
        const reminder: AgentReminder = {
          id,
          spec_id: specId,
          message,
          priority,
          created_at: now,
          scheduled_for: scheduledFor,
        };
        
        set(state => ({
          reminders: { ...state.reminders, [id]: reminder },
          activeReminders: scheduledFor && scheduledFor > now 
            ? state.activeReminders 
            : [...state.activeReminders, id]
        }));
        
        return id;
      },

      dismissReminder: (id: string) => {
        const now = Date.now();
        set(state => ({
          reminders: {
            ...state.reminders,
            [id]: state.reminders[id] ? {
              ...state.reminders[id],
              dismissed: true,
              dismissed_at: now,
            } : state.reminders[id]
          },
          activeReminders: state.activeReminders.filter(rid => rid !== id)
        }));
      },

      getActiveReminders: () => {
        const state = get();
        const now = Date.now();
        
        return state.activeReminders
          .map(id => state.reminders[id])
          .filter(reminder => 
            reminder && 
            !reminder.dismissed &&
            (!reminder.scheduled_for || reminder.scheduled_for <= now) &&
            (!reminder.auto_dismiss_after_ms || (now - reminder.created_at) < reminder.auto_dismiss_after_ms)
          );
      },

      cleanupExpiredReminders: () => {
        const now = Date.now();
        
        set(prevState => {
          const updatedReminders = { ...prevState.reminders };
          const activeReminders = [...prevState.activeReminders];
          
          // Clean up auto-dismissing reminders
          Object.values(updatedReminders).forEach(reminder => {
            if (reminder.auto_dismiss_after_ms && 
                (now - reminder.created_at) >= reminder.auto_dismiss_after_ms &&
                !reminder.dismissed) {
              updatedReminders[reminder.id] = {
                ...reminder,
                dismissed: true,
                dismissed_at: now,
              };
              const index = activeReminders.indexOf(reminder.id);
              if (index >= 0) {
                activeReminders.splice(index, 1);
              }
            }
          });
          
          return {
            reminders: updatedReminders,
            activeReminders,
          };
        });
      },

      recordActivation: (specId: string, trigger: SteeringTrigger, action: SteeringAction, conversationId?: string, messageId?: string) => {
        const id = generateId();
        const now = Date.now();
        
        const activation: SteeringActivation = {
          id,
          spec_id: specId,
          trigger,
          action,
          activated_at: now,
          conversation_id: conversationId,
          message_id: messageId,
        };
        
        set(state => {
          const spec = state.specs[specId];
          const newState: Partial<AgentSteeringState> = {
            activations: { ...state.activations, [id]: activation },
            lastActivation: now,
          };
          
          // Update cooldown if spec has one
          if (spec?.cooldown_ms) {
            newState.cooldownSpecs = {
              ...state.cooldownSpecs,
              [specId]: now + spec.cooldown_ms,
            };
          }
          
          return newState;
        });
        
        return id;
      },

      getSpecActivations: (specId: string) => {
        const state = get();
        return Object.values(state.activations).filter(activation => activation.spec_id === specId);
      },

      evaluateSpecs: (context: EvaluationContext) => {
        const { shouldActivateSpec, recordActivation, createReminder } = get();
        const activations: SteeringActivation[] = [];
        const currentState = get();
        
        Object.values(currentState.specs).forEach(spec => {
          if (!spec.enabled || !shouldActivateSpec(spec, context)) {
            return;
          }
          
          spec.triggers.forEach(trigger => {
            spec.actions.forEach(action => {
              const activationId = recordActivation(spec.id, trigger, action, context.conversationId, context.messageId);
              const newState = get();
              const activation = newState.activations[activationId];
              
              if (activation) {
                activations.push(activation);
                
                // Create reminders for reminder actions
                if (action.type === 'reminder') {
                  createReminder(spec.id, action.message, action.priority);
                }
              }
            });
          });
        });
        
        return activations;
      },

      shouldActivateSpec: (spec: AgentSteeringSpec, context: EvaluationContext) => {
        const state = get();
        const { isSpecInCooldown, getSpecActivationCount } = get();
        
        // Check if spec is in cooldown
        if (isSpecInCooldown(spec.id)) {
          return false;
        }
        
        // Check max activations
        if (spec.max_activations && getSpecActivationCount(spec.id) >= spec.max_activations) {
          return false;
        }
        
        // Check conditions
        if (spec.conditions) {
          const c = spec.conditions;
          if (c.conversation_length_min && context.conversationLength < c.conversation_length_min) return false;
          if (c.conversation_length_max && context.conversationLength > c.conversation_length_max) return false;
          if (c.context_files_min && context.contextFilesCount < c.context_files_min) return false;
          if (c.model_types && context.modelType && !c.model_types.includes(context.modelType)) return false;
          // Add more condition checks as needed
        }
        
        // Check triggers
        return spec.triggers.some(trigger => {
          switch (trigger.type) {
            case 'time_interval':
              return state.lastActivation ? 
                (context.currentTimestamp - state.lastActivation) >= trigger.intervalMs :
                true; // First activation
                
            case 'plan_step':
              return context.lastPlanStep?.status === trigger.stepStatus;
              
            case 'message_count':
              return context.conversationLength >= trigger.count;
              
            case 'idle_time':
              return (context.currentTimestamp - context.lastMessageTimestamp) >= trigger.idleMs;
              
            case 'context_change':
              return Boolean(context.recentContextChange && 
                (!trigger.filePattern || 
                 (context.recentContextChange.filePattern?.includes(trigger.filePattern))));
                 
            case 'manual':
              return false; // Manual triggers are activated externally
              
            default:
              return false;
          }
        });
      },

      getSpecsForConversation: () => {
        const state = get();
        return Object.values(state.specs).filter(spec => spec.enabled);
      },

      isSpecInCooldown: (specId: string) => {
        const state = get();
        const cooldownEnd = state.cooldownSpecs[specId];
        return cooldownEnd ? Date.now() < cooldownEnd : false;
      },

      getSpecActivationCount: (specId: string) => {
        const state = get();
        return Object.values(state.activations).filter(activation => activation.spec_id === specId).length;
      },
    }),
    {
      name: 'agent-steering-store',
      partialize: (state) => ({
        specs: state.specs,
        reminders: state.reminders,
        activations: state.activations,
        cooldownSpecs: state.cooldownSpecs,
      }),
    }
  )
);