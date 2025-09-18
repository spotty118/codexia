/**
 * Simple test to demonstrate agent steering functionality
 * This can be run in a browser console or Node.js environment
 */

// Mock the zustand persist functionality for this test
const mockPersist = (fn) => fn;

// Import types (these would normally be imported)
const DEFAULT_STEERING_TEMPLATES = [
  {
    name: "Regular Progress Check",
    description: "Remind agent to provide progress updates every 5 minutes",
    triggers: [{ type: 'time_interval', intervalMs: 5 * 60 * 1000 }],
    actions: [{ 
      type: 'reminder', 
      message: "Please provide a progress update on your current task.", 
      priority: 'medium' 
    }]
  }
];

// Simplified store implementation for testing
class TestAgentSteeringStore {
  constructor() {
    this.specs = {};
    this.reminders = {};
    this.activations = {};
    this.activeReminders = [];
    this.cooldownSpecs = {};
    this.lastActivation = undefined;
  }

  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  createSpec(name, description) {
    const id = this.generateId();
    const now = Date.now();
    this.specs[id] = {
      id,
      name,
      description,
      enabled: true,
      triggers: [],
      actions: [],
      created_at: now,
      updated_at: now,
    };
    return id;
  }

  updateSpec(id, updates) {
    if (this.specs[id]) {
      this.specs[id] = {
        ...this.specs[id],
        ...updates,
        updated_at: Date.now(),
      };
    }
  }

  createSpecFromTemplate(templateIndex) {
    const template = DEFAULT_STEERING_TEMPLATES[templateIndex];
    if (!template) return '';
    
    const id = this.createSpec(template.name, template.description);
    this.updateSpec(id, {
      triggers: template.triggers,
      actions: template.actions,
      conditions: template.conditions,
    });
    return id;
  }

  createReminder(specId, message, priority, scheduledFor) {
    const id = this.generateId();
    const now = Date.now();
    
    this.reminders[id] = {
      id,
      spec_id: specId,
      message,
      priority,
      created_at: now,
      scheduled_for: scheduledFor,
    };
    
    if (!scheduledFor || scheduledFor <= now) {
      this.activeReminders.push(id);
    }
    
    return id;
  }

  getActiveReminders() {
    const now = Date.now();
    return this.activeReminders
      .map(id => this.reminders[id])
      .filter(reminder => 
        reminder && 
        !reminder.dismissed &&
        (!reminder.scheduled_for || reminder.scheduled_for <= now)
      );
  }

  evaluateSpecs(context) {
    const activations = [];
    
    Object.values(this.specs).forEach(spec => {
      if (!spec.enabled || !this.shouldActivateSpec(spec, context)) {
        return;
      }
      
      spec.triggers.forEach(trigger => {
        spec.actions.forEach(action => {
          const activationId = this.recordActivation(spec.id, trigger, action, context.conversationId, context.messageId);
          const activation = this.activations[activationId];
          
          if (activation) {
            activations.push(activation);
            
            // Create reminders for reminder actions
            if (action.type === 'reminder') {
              this.createReminder(spec.id, action.message, action.priority);
            }
          }
        });
      });
    });
    
    return activations;
  }

  shouldActivateSpec(spec, context) {
    // Check conditions
    if (spec.conditions) {
      const c = spec.conditions;
      if (c.conversation_length_min && context.conversationLength < c.conversation_length_min) return false;
      if (c.context_files_min && context.contextFilesCount < c.context_files_min) return false;
    }
    
    // Check triggers
    return spec.triggers.some(trigger => {
      switch (trigger.type) {
        case 'time_interval':
          return this.lastActivation ? 
            (context.currentTimestamp - this.lastActivation) >= trigger.intervalMs :
            true; // First activation
            
        case 'message_count':
          return context.conversationLength >= trigger.count;
          
        default:
          return false;
      }
    });
  }

  recordActivation(specId, trigger, action, conversationId, messageId) {
    const id = this.generateId();
    const now = Date.now();
    
    this.activations[id] = {
      id,
      spec_id: specId,
      trigger,
      action,
      activated_at: now,
      conversation_id: conversationId,
      message_id: messageId,
    };
    
    this.lastActivation = now;
    return id;
  }
}

// Test function
function testAgentSteering() {
  console.log("🎯 Testing Agent Steering System");
  
  const store = new TestAgentSteeringStore();
  
  // Test 1: Create spec from template
  console.log("\n📋 Test 1: Creating spec from template");
  const specId = store.createSpecFromTemplate(0);
  console.log("Created spec:", store.specs[specId]);
  
  // Test 2: Evaluate specs with message count trigger
  console.log("\n🔍 Test 2: Adding message count trigger and evaluating");
  const messageCountSpecId = store.createSpec("Message Count Test", "Test message counting");
  store.updateSpec(messageCountSpecId, {
    triggers: [{ type: 'message_count', count: 5 }],
    actions: [{ 
      type: 'reminder', 
      message: "You've sent 5 messages, consider taking a break!",
      priority: 'low' 
    }]
  });
  
  // Simulate evaluation context
  const context = {
    conversationLength: 5,
    contextFilesCount: 3,
    currentTimestamp: Date.now(),
    lastMessageTimestamp: Date.now() - 1000,
  };
  
  const activations = store.evaluateSpecs(context);
  console.log("Activations:", activations);
  console.log("Active reminders:", store.getActiveReminders());
  
  // Test 3: Time interval trigger
  console.log("\n⏰ Test 3: Testing time interval trigger");
  // Simulate that 5+ minutes have passed
  const pastContext = {
    ...context,
    currentTimestamp: Date.now() + (6 * 60 * 1000), // 6 minutes later
  };
  
  const timeActivations = store.evaluateSpecs(pastContext);
  console.log("Time-based activations:", timeActivations);
  console.log("All active reminders:", store.getActiveReminders());
  
  console.log("\n✅ Agent Steering System test completed!");
  console.log("Total specs:", Object.keys(store.specs).length);
  console.log("Total reminders:", Object.keys(store.reminders).length);
  console.log("Total activations:", Object.keys(store.activations).length);
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  window.testAgentSteering = testAgentSteering;
  console.log("Agent Steering test available. Run: testAgentSteering()");
} else if (typeof module !== 'undefined') {
  // Node.js environment
  module.exports = { testAgentSteering, TestAgentSteeringStore };
}

// Auto-run if in Node.js
if (typeof require !== 'undefined') {
  testAgentSteering();
}