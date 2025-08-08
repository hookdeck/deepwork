# Deep Research Display Architecture Plan

## Overview

This document outlines the architecture for displaying OpenAI Deep Research API responses in a human-readable format, replacing the current raw JSON display in the ResearchResults component.

## 1. TypeScript Type Definitions

Create a new file: `src/types/deep-research.ts`

```typescript
/**
 * Types for OpenAI Deep Research API Response
 * Based on the OpenAI API documentation for deep research responses
 */

// Main response type from OpenAI Deep Research API
export interface DeepResearchResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    detailed_completion_tokens?: {
      reasoning_tokens: number;
      output_tokens: number;
    };
  };
  metadata?: {
    researchId?: string;
    [key: string]: any;
  };
  output?: DeepResearchOutput[];
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

// Union type for different output types
export type DeepResearchOutput =
  | WebSearchCallOutput
  | ReasoningOutput
  | MessageOutput;

// Base interface for all output items
interface BaseOutput {
  type: string;
  timestamp?: number;
}

// Web search call output type
export interface WebSearchCallOutput extends BaseOutput {
  type: "web_search_call";
  query: string;
  results?: WebSearchResult[];
  status?: "pending" | "completed" | "failed";
  error?: string;
}

// Individual web search result
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance_score?: number;
  published_date?: string;
  source?: string;
}

// Reasoning step output type
export interface ReasoningOutput extends BaseOutput {
  type: "reasoning";
  content: string;
  step_number?: number;
  reasoning_type?: "analysis" | "synthesis" | "evaluation" | "planning";
}

// Final message output type
export interface MessageOutput extends BaseOutput {
  type: "message";
  role: "assistant" | "system";
  content: string;
  confidence_score?: number;
  citations?: Citation[];
}

// Citation reference
export interface Citation {
  text: string;
  sources: string[];
  confidence?: number;
}

// Helper type guards
export function isWebSearchCall(
  output: DeepResearchOutput
): output is WebSearchCallOutput {
  return output.type === "web_search_call";
}

export function isReasoning(
  output: DeepResearchOutput
): output is ReasoningOutput {
  return output.type === "reasoning";
}

export function isMessage(output: DeepResearchOutput): output is MessageOutput {
  return output.type === "message";
}

// Parsed research result combining status and content
export interface ParsedResearchResult {
  response: DeepResearchResponse;
  summary?: string;
  searchQueries: string[];
  reasoningSteps: ReasoningOutput[];
  finalAnswer?: string;
  citations: Citation[];
  totalTokensUsed?: number;
}
```

## 2. Component Architecture

### 2.1 DeepResearchDisplay (Main Orchestrator)

**File**: `src/components/research/DeepResearchDisplay.tsx`

```typescript
interface DeepResearchDisplayProps {
  data: string; // JSON string to be parsed
  className?: string;
}
```

**Structure**:

```tsx
export default function DeepResearchDisplay({
  data,
  className,
}: DeepResearchDisplayProps) {
  // Parse JSON and handle errors
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data) as DeepResearchResponse;
    } catch (error) {
      return null;
    }
  }, [data]);

  // Categorize outputs
  const { searches, reasoning, messages } = useMemo(() => {
    // Group outputs by type
  }, [parsedData]);

  return (
    <div className={className}>
      <ResearchSummary response={parsedData} />

      {/* Search Results Section */}
      <CollapsibleSection title="Web Searches">
        {searches.map((search, idx) => (
          <WebSearchCall key={idx} searchCall={search} index={idx} />
        ))}
      </CollapsibleSection>

      {/* Reasoning Section */}
      <CollapsibleSection title="AI Reasoning Process">
        {reasoning.map((step, idx) => (
          <ReasoningStep key={idx} reasoning={step} stepNumber={idx + 1} />
        ))}
      </CollapsibleSection>

      {/* Final Answer */}
      {messages.map((msg, idx) => (
        <FinalMessage key={idx} message={msg} />
      ))}
    </div>
  );
}
```

### 2.2 ResearchSummary

**File**: `src/components/research/ResearchSummary.tsx`

```typescript
interface ResearchSummaryProps {
  response: DeepResearchResponse;
  searchCount: number;
  reasoningStepCount: number;
}
```

**Displays**:

- Model information (GPT-4, etc.)
- Token usage with breakdown
- Timestamp
- High-level metrics
- Error state if present

### 2.3 WebSearchCall

**File**: `src/components/research/WebSearchCall.tsx`

```typescript
interface WebSearchCallProps {
  searchCall: WebSearchCallOutput;
  index: number;
}
```

**Features**:

- Display search query prominently
- Card layout for each search result
- Show relevance scores as progress bars
- Make URLs clickable (open in new tab)
- Truncate snippets with "Show more" option

### 2.4 ReasoningStep

**File**: `src/components/research/ReasoningStep.tsx`

```typescript
interface ReasoningStepProps {
  reasoning: ReasoningOutput;
  stepNumber: number;
}
```

**Features**:

- Step number indicator
- Reasoning type badge (analysis/synthesis/evaluation/planning)
- Formatted content with markdown support
- Collapsible for long content

### 2.5 FinalMessage

**File**: `src/components/research/FinalMessage.tsx`

```typescript
interface FinalMessageProps {
  message: MessageOutput;
}
```

**Features**:

- Prominent display with success styling
- Markdown rendering for formatted content
- Confidence score indicator
- Inline citations with hover tooltips
- Copy-to-clipboard functionality

### 2.6 CitationList

**File**: `src/components/research/CitationList.tsx`

```typescript
interface CitationListProps {
  citations: Citation[];
}
```

**Features**:

- Numbered citation list
- Source links
- Confidence indicators
- Grouped by source domain

### 2.7 CollapsibleSection (Utility Component)

**File**: `src/components/research/CollapsibleSection.tsx`

```typescript
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string | number;
}
```

## 3. Modifications to ResearchResults.tsx

Update the existing `src/components/ResearchResults.tsx`:

```typescript
import { useState, useMemo } from "react";
import DeepResearchDisplay from "./research/DeepResearchDisplay";
import { DeepResearchResponse } from "@/types/deep-research";

interface ResearchResultsProps {
  data: string;
  className?: string;
}

export default function ResearchResults({
  data,
  className = "",
}: ResearchResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect if this is a Deep Research response
  const isDeepResearch = useMemo(() => {
    try {
      const parsed = JSON.parse(data);
      return (
        parsed.object === "realtime.response" ||
        parsed.object === "research.response" ||
        (parsed.output && Array.isArray(parsed.output))
      );
    } catch {
      return false;
    }
  }, [data]);

  // If it's Deep Research data, use the specialized display
  if (isDeepResearch) {
    return <DeepResearchDisplay data={data} className={className} />;
  }

  // Otherwise, fall back to the existing raw display
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Research Results
        </h3>
      </div>
      <div className="p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre
            className={`whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans ${
              isExpanded ? "" : "max-h-60 overflow-hidden"
            }`}
          >
            {data}
          </pre>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 dark:text-blue-400 hover:underline mt-4"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 4. Visual Design System

### Color Palette

- **Search Results**: Blue theme (#3B82F6)
- **Reasoning Steps**: Gray theme (#6B7280)
- **Final Answer**: Green theme (#10B981)
- **Citations**: Amber theme (#F59E0B)
- **Errors**: Red theme (#EF4444)

### Layout Structure

```
┌─────────────────────────────────────┐
│  Research Summary                   │
│  • Model, Tokens, Timestamp         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  📍 Web Searches (3)            [▼] │
│  ┌─────────────────────────────┐   │
│  │ Query: "OpenAI Deep Research"│   │
│  │ • Result 1 (95% relevant)    │   │
│  │ • Result 2 (89% relevant)    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  🧠 AI Reasoning (5 steps)      [▼] │
│  ┌─────────────────────────────┐   │
│  │ Step 1: Analysis             │   │
│  │ [Content...]                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  ✅ Final Answer                    │
│  [Formatted markdown content]       │
│  📚 Citations: [1] [2] [3]         │
└─────────────────────────────────────┘
```

## 5. Implementation Steps

1. **Phase 1: Type Definitions**

   - Create `src/types/deep-research.ts` with all type definitions
   - Add type guards and helper functions

2. **Phase 2: Utility Components**

   - Implement CollapsibleSection component
   - Create shared styling utilities

3. **Phase 3: Display Components**

   - Implement ResearchSummary
   - Implement WebSearchCall
   - Implement ReasoningStep
   - Implement FinalMessage
   - Implement CitationList

4. **Phase 4: Main Orchestrator**

   - Implement DeepResearchDisplay
   - Add error handling and loading states

5. **Phase 5: Integration**
   - Update ResearchResults.tsx
   - Test with sample Deep Research data
   - Handle edge cases and errors

## 6. Error Handling

- Invalid JSON: Show fallback to raw display
- Missing fields: Handle gracefully with optional chaining
- Empty outputs: Show appropriate empty states
- Large datasets: Implement pagination or virtualization

## 7. Performance Considerations

- Use `useMemo` for expensive JSON parsing
- Lazy load collapsed sections
- Virtualize long lists of search results
- Implement debounced expand/collapse animations

## 8. Accessibility

- Proper ARIA labels for collapsible sections
- Keyboard navigation support
- Screen reader friendly citations
- High contrast mode support

## 9. Testing Strategy

- Unit tests for type guards
- Component tests for each display component
- Integration tests for the full flow
- Visual regression tests for styling

## 10. Future Enhancements

- Export to PDF functionality
- Search within results
- Highlighting and annotations
- Comparison view for multiple researches
- Real-time streaming support for in-progress research
