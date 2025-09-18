/**
 * Types for spec-driven agent steering with reminders
 */

export type SteeringTrigger = 
  | { type: 'time_interval'; intervalMs: number }
  | { type: 'plan_step'; stepStatus: 'pending' | 'in_progress' | 'completed' }
  | { type: 'message_count'; count: number }
  | { type: 'idle_time'; idleMs: number }
  | { type: 'context_change'; filePattern?: string }
  | { type: 'manual'; };

export type SteeringAction =
  | { type: 'reminder'; message: string; priority: 'low' | 'medium' | 'high' }
  | { type: 'suggestion'; content: string; auto_dismiss?: boolean }
  | { type: 'constraint'; rules: string[]; enforce: boolean }
  | { type: 'redirect'; new_focus: string; reason?: string };

export interface AgentSteeringSpec {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggers: SteeringTrigger[];
  actions: SteeringAction[];
  conditions?: {
    // Optional conditions that must be met for steering to activate
    conversation_length_min?: number;
    conversation_length_max?: number;
    context_files_min?: number;
    model_types?: string[];
    workspace_patterns?: string[];
  };
  // Configuration
  max_activations?: number; // Limit how many times this can trigger
  cooldown_ms?: number; // Minimum time between activations
  created_at: number;
  updated_at: number;
}

export interface AgentReminder {
  id: string;
  spec_id: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at: number;
  scheduled_for?: number; // timestamp when reminder should show
  dismissed?: boolean;
  dismissed_at?: number;
  auto_dismiss_after_ms?: number;
  conversation_id?: string; // Associate with specific conversation
  metadata?: Record<string, any>; // Additional context
}

export interface SteeringActivation {
  id: string;
  spec_id: string;
  trigger: SteeringTrigger;
  action: SteeringAction;
  activated_at: number;
  conversation_id?: string;
  message_id?: string; // If triggered by specific message
  result?: 'success' | 'failed' | 'dismissed';
  metadata?: Record<string, any>;
}

export interface AgentSteeringState {
  specs: Record<string, AgentSteeringSpec>;
  reminders: Record<string, AgentReminder>;
  activations: Record<string, SteeringActivation>;
  // Runtime state
  lastActivation?: number;
  activeReminders: string[]; // IDs of currently active reminders
  cooldownSpecs: Record<string, number>; // spec_id -> timestamp when cooldown ends
}

// Utility types for UI
export interface SteeringSpecTemplate {
  name: string;
  description: string;
  triggers: SteeringTrigger[];
  actions: SteeringAction[];
  conditions?: AgentSteeringSpec['conditions'];
}

export const DEFAULT_STEERING_TEMPLATES: SteeringSpecTemplate[] = [
  {
    name: "Regular Progress Check",
    description: "Remind agent to provide progress updates every 5 minutes",
    triggers: [{ type: 'time_interval', intervalMs: 5 * 60 * 1000 }],
    actions: [{ 
      type: 'reminder', 
      message: "Please provide a progress update on your current task.", 
      priority: 'medium' 
    }]
  },
  {
    name: "Plan Step Completion Reminder",
    description: "Remind when plan steps are completed to check if user wants to continue",
    triggers: [{ type: 'plan_step', stepStatus: 'completed' }],
    actions: [{ 
      type: 'suggestion', 
      content: "A plan step has been completed. Would you like to review the results before continuing?",
      auto_dismiss: true
    }]
  },
  {
    name: "Context Awareness Check",
    description: "Remind agent to check context when many files are involved",
    triggers: [{ type: 'context_change' }],
    actions: [{ 
      type: 'reminder', 
      message: "Consider reviewing the context files to ensure all relevant information is being used.",
      priority: 'low' 
    }],
    conditions: {
      context_files_min: 5
    }
  },
  {
    name: "Long Conversation Focus",
    description: "Help maintain focus in long conversations",
    triggers: [{ type: 'message_count', count: 20 }],
    actions: [{ 
      type: 'reminder', 
      message: "This is a long conversation. Consider summarizing progress or breaking into subtasks.",
      priority: 'medium' 
    }]
  }
];