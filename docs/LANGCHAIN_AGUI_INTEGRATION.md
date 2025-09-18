# LangChain and AG UI Integration Guide

This guide explains how the simplified Codexia architecture makes it easy to integrate LangChain and AG UI without conflicts.

## Why This Simplified Architecture Works Better

### Before (Complex)
- **13 separate Zustand stores** with complex interdependencies
- **436-line ConversationStore** with over-engineered state management
- **Complex MCP system** competing with other agent frameworks
- **Enterprise-grade features** that distract from core coding experience
- **15,495 lines of code** across 134 files

### After (Simple & Vibe)
- **1 main CoreStore** with all essential state
- **Clean provider system** that easily accommodates new integrations
- **Simplified chat interface** focused on coding workflow
- **Built-in LangChain support** as a first-class provider
- **Minimal codebase** focused on core functionality

## LangChain Integration Points

### 1. Provider System
The simplified provider system now includes LangChain as a built-in option:

```typescript
// CoreStore.ts already includes:
type Provider = "openai" | "google" | "ollama" | "openrouter" | "xai" | "langchain";

langchain: {
  apiKey: "",
  baseUrl: "http://localhost:8000", // Default LangChain server
  models: ["langchain-agent", "custom-chain"]
}
```

### 2. Easy Backend Integration
To add LangChain support, you only need to modify the Rust backend to handle the "langchain" provider:

```rust
// src-tauri/src/codex_client.rs
match provider.as_str() {
    "langchain" => {
        // Route to LangChain server instead of Codex CLI
        handle_langchain_request(message, model, config).await
    }
    _ => {
        // Existing Codex CLI handling
        handle_codex_request(message, model, config).await
    }
}
```

### 3. Agent Workflow Support
LangChain agents can leverage the existing event system:

```typescript
// Events that work seamlessly with LangChain:
| { type: 'mcp_tool_call_begin'; invocation: any }
| { type: 'mcp_tool_call_end'; invocation: any; result?: any; duration?: number }
| { type: 'agent_message'; message?: string }
| { type: 'plan_update'; plan: Array<{ step: string; status: string }> }
```

## AG UI Integration Points

### 1. Component Architecture
The simplified component structure makes it easy to integrate AG UI components:

```typescript
// Replace SimpleChatInterface with AG UI components:
import { AGChatInterface } from '@ag-ui/react';

export const SimpleChatInterface = () => {
  const coreStore = useCoreStore();
  
  return (
    <AGChatInterface
      messages={coreStore.getCurrentConversation()?.messages || []}
      onSendMessage={coreStore.addMessage}
      provider={coreStore.currentProvider}
      model={coreStore.currentModel}
    />
  );
};
```

### 2. Theme Integration
AG UI can use the same theme system:

```typescript
const { theme } = useCoreStore();

<AGProvider theme={theme}>
  <SimpleChatInterface />
</AGProvider>
```

### 3. File Tree Integration
AG UI components can easily access the file system through the simplified store:

```typescript
const { currentFolder, showFileTree } = useCoreStore();

<AGFileExplorer 
  rootPath={currentFolder}
  visible={showFileTree}
  onFileSelect={(path) => /* add to context */}
/>
```

## Migration Strategy

### Phase 1: Core Simplification ✅
- [x] Consolidate stores into CoreStore
- [x] Create simplified chat interface
- [x] Add LangChain as provider option
- [x] Simplify app layout

### Phase 2: LangChain Integration
- [ ] Add LangChain server communication to Rust backend
- [ ] Implement agent workflow events
- [ ] Add custom chain configuration UI
- [ ] Test with popular LangChain agents

### Phase 3: AG UI Integration  
- [ ] Replace chat components with AG UI equivalents
- [ ] Integrate AG UI file explorer
- [ ] Add AG UI theme support
- [ ] Ensure seamless user experience

### Phase 4: Advanced Features
- [ ] Multi-agent workflows
- [ ] Custom tool integration
- [ ] Advanced file context management
- [ ] Real-time collaboration

## Benefits of This Approach

### No Conflicts
- **Simple provider system** means LangChain and AG UI don't compete with MCP
- **Clean state management** prevents store conflicts
- **Minimal dependencies** reduce integration friction

### Enhanced Experience
- **Vibe coding focus** - less enterprise overhead, more coding flow
- **Better performance** - simplified architecture is faster
- **Easier maintenance** - less code to debug and maintain

### Future-Proof
- **Extensible design** - easy to add new providers and UI frameworks
- **Clean abstractions** - new integrations don't require rewrites
- **Focused scope** - core functionality remains stable

## Example: Adding a LangChain Agent

```typescript
// 1. Configure in settings
const { setProviderApiKey, setCurrentModel } = useCoreStore();

setProviderApiKey('langchain', 'optional-token');
setCurrentModel('research-agent', 'langchain');

// 2. Use in chat - no other changes needed!
// The simplified architecture handles the rest
```

This simplified approach makes Codexia feel more like a "vibe coding" tool rather than an enterprise application, while making LangChain and AG UI integration straightforward and conflict-free.