# Agent Steering System Demo

This file demonstrates how the new agent steering with reminders system works.

## Features Implemented

### 1. Type Definitions (`src/types/agentSteering.ts`)
- `SteeringTrigger`: Define when steering should activate (time intervals, plan steps, message counts, etc.)
- `SteeringAction`: Define what action to take (reminders, suggestions, constraints, redirects)
- `AgentSteeringSpec`: Configuration for steering behaviors
- `AgentReminder`: Time-based or event-based reminders
- Pre-defined templates for common steering patterns

### 2. Store Management (`src/stores/AgentSteeringStore.ts`)
- Zustand store with persistence for managing steering state
- Methods for creating, updating, and evaluating steering specs
- Reminder lifecycle management (creation, dismissal, cleanup)
- Activation tracking and cooldown management

### 3. UI Components

#### AgentRemindersPanel (`src/components/chat/AgentRemindersPanel.tsx`)
- Displays active reminders in the chat interface
- Priority-based styling (high/medium/low)
- Dismissible reminders with timestamps
- Automatic cleanup of expired reminders

#### AgentSteeringConfig (`src/components/dialogs/AgentSteeringConfig.tsx`)
- Configuration dialog for managing steering specs
- Template-based spec creation
- Statistics and activation tracking
- Enable/disable individual specs

### 4. Integration Points

#### AgentMessage Component
- Automatically evaluates steering specs when agent messages are rendered
- Shows active reminders below agent messages
- Triggers based on plan updates, context changes, etc.

#### App Header
- Added "Steering" button in the chat page header (next to MCP button)
- Provides quick access to steering configuration

## How It Works

1. **Spec Creation**: Users can create steering specs either manually or from templates
2. **Trigger Evaluation**: When agent messages are rendered, the system evaluates all active specs
3. **Action Execution**: If triggers match, actions are executed (e.g., creating reminders)
4. **Reminder Display**: Active reminders are shown in the chat interface
5. **Lifecycle Management**: Reminders can be dismissed or auto-expire

## Example Usage

```typescript
// Create a spec from template
const specId = createSpecFromTemplate(0); // "Regular Progress Check"

// Manual spec creation
const customSpecId = createSpec("Custom Reminder", "Remind about code quality");
updateSpec(customSpecId, {
  triggers: [{ type: 'message_count', count: 10 }],
  actions: [{ 
    type: 'reminder', 
    message: "Consider reviewing code quality and adding tests",
    priority: 'medium' 
  }],
  cooldown_ms: 5 * 60 * 1000 // 5 minutes
});

// The system will automatically:
// 1. Evaluate specs when agent messages are rendered
// 2. Create reminders when triggers match
// 3. Display reminders in the UI
// 4. Handle dismissal and cleanup
```

## Templates Included

1. **Regular Progress Check**: Reminds every 5 minutes for progress updates
2. **Plan Step Completion**: Reminds when plan steps complete
3. **Context Awareness Check**: Reminds to check context when many files involved
4. **Long Conversation Focus**: Helps maintain focus in lengthy conversations

## Benefits

- **Proactive Guidance**: Helps steer agent behavior without manual intervention
- **Contextual**: Triggers based on conversation state and agent actions
- **Configurable**: Fully customizable triggers, actions, and conditions
- **Non-intrusive**: Reminders can be dismissed and have cooldowns
- **Persistent**: Configuration and state are persisted across sessions