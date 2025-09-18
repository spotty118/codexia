# App Type Detection for Agent Steering

This document describes the new app type detection feature implemented for agent steering specs.

## Overview

When creating steering specs for a codebase, the system now automatically detects what type of app the codebase is (web app, backend service, mobile app, etc.) and helps keep the agent focused on appropriate concerns for that app type.

## Features

### 1. Automatic App Type Detection

The system automatically detects app types from the current workspace when creating specs:

- **Web Apps**: React, Vue, Angular, Next.js, Nuxt, etc.
- **Backend Services**: Express, FastAPI, Flask, Spring Boot, etc.
- **Desktop Apps**: Tauri, Electron
- **Mobile Apps**: React Native, Flutter (future)
- **Libraries**: NPM packages, Python packages, etc.

### 2. Visual Indicators

- App type icons and badges in the steering config UI
- Confidence level indicators (high/medium/low)
- Color-coded visual feedback

### 3. Focus Guidance

Each app type provides specific focus areas to help keep agents on track:

- **Web Apps**: UI/UX, performance, accessibility, responsive design
- **Backend Services**: API design, scalability, security, error handling
- **Desktop Apps**: Native patterns, system integration, file management
- **Mobile Apps**: Platform guidelines, offline functionality, push notifications
- **Libraries**: API design, documentation, backwards compatibility

### 4. App Type-Specific Templates

Pre-built steering spec templates tailored to different app types:

- Web App UX Focus
- Backend API Design Focus
- Mobile App Platform Focus
- Desktop App Integration Focus
- Library API Design Focus

## Implementation Details

### File Structure

```
src/
├── types/agentSteering.ts          # Extended with app_type field
├── utils/appTypeDetection.ts       # New detection utility
├── stores/AgentSteeringStore.ts    # Enhanced with app type support
└── components/dialogs/AgentSteeringConfig.tsx  # Updated UI
```

### Key Components

1. **`detectAppType()`** - Analyzes project files to determine app type
2. **`getAppTypeDisplayName()`** - Formats app type for display
3. **`getAppTypeFocusGuidance()`** - Provides app-specific guidance
4. **Enhanced AgentSteeringSpec** - Now includes `app_type` metadata

### Supported Languages & Frameworks

- **JavaScript/TypeScript**: React, Vue, Angular, Express, Fastify, etc.
- **Python**: Django, Flask, FastAPI
- **Rust**: Tauri, general Rust projects
- **Go**: General Go projects
- **Java**: Spring Boot, Maven/Gradle projects

## Usage

### Creating a Spec

1. Open a project workspace
2. Navigate to Agent Steering configuration
3. Create a new spec - app type is automatically detected
4. Review the detected app type and focus guidance
5. Choose from app type-specific templates if desired

### Visual Feedback

- Green indicator: High confidence detection
- Yellow indicator: Medium confidence detection
- Gray indicator: Low confidence or unknown

## Benefits

1. **Focused Reminders**: Agents get contextual guidance relevant to the app type
2. **Faster Setup**: No manual configuration needed
3. **Visual Context**: Clear indicators of project type and confidence
4. **Smart Templates**: Pre-built templates for different app types
5. **Better Agent Performance**: Helps agents stay focused on relevant concerns

## Future Enhancements

- Support for more languages and frameworks
- Machine learning-based confidence scoring
- Custom app type definitions
- Integration with project metadata
- Team-specific app type configurations