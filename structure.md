# Project Structure

## Root Directory
```
/home/runner/work/codexia/codexia
```

## Main Directories
- **src/**: Main source code directory
  - Conventions: TypeScript files, React components, organized by feature
- **src/components/**: Reusable UI components
  - Conventions: PascalCase naming, feature-based subdirectories
- **src/stores/**: Zustand state management stores
  - Conventions: Store suffix, single responsibility per store
- **src/types/**: TypeScript type definitions
  - Conventions: Interface definitions, type exports
- **src/utils/**: Utility functions and helpers
  - Conventions: Pure functions, camelCase naming
- **src/services/**: External service integrations
  - Conventions: Service classes, API wrappers
- **src/hooks/**: Custom React hooks
  - Conventions: use prefix, single responsibility
- **src-tauri/**: Tauri backend Rust code
  - Conventions: Rust naming conventions, modular structure
- **public/**: Static assets and resources
  - Conventions: Optimized images, favicon, manifest files

## File Naming Conventions
- **Components**: PascalCase.tsx (e.g., ChatView.tsx)
- **Utilities**: camelCase.ts (e.g., fileUtils.ts)
- **Types**: camelCase.ts (e.g., agentSteering.ts)
- **Tests**: *.test.ts or *.test.tsx
- **Stores**: PascalCaseStore.ts (e.g., ConversationStore.ts)

## Import Patterns
- **Relative Imports**: ./filename for same directory
- **Absolute Imports**: @/path/to/file using TypeScript path mapping
- **Barrel Exports**: Yes, index.ts files for clean imports

## Architectural Decisions
- **Component-based architecture**: Better maintainability and reusability
- **Zustand for state management**: Lightweight and TypeScript-friendly alternative to Redux
- **Tauri for desktop integration**: Native performance with web technologies
- **TypeScript throughout**: Type safety and better developer experience
- **Feature-based organization**: Components grouped by functionality rather than type
- **Separation of concerns**: Clear boundaries between UI, state, and business logic

---
Generated on: 2025-01-18T04:50:00.000Z
Codebase: Codexia