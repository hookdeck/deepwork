/**
 * Types for OpenAI Deep Research API Response
 * Based on the OpenAI API documentation for deep research responses
 */

// Main response type from OpenAI Deep Research API
export interface DeepResearchResponse {
  id: string;
  object: string;
  created_at: number;
  created?: number;
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
  id?: string;
  status: "pending" | "completed" | "failed";
  action: WebSearchAction;
  error?: string;
}

// Web search action types
export type WebSearchAction =
  | {
      type: "search";
      query: string;
    }
  | {
      type: "open_page";
      url: string | null;
    }
  | {
      type: "find_in_page";
      pattern: string;
      url: string | null;
    };

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
  id?: string;
  summary: string[]; // Array of strings, can be empty
  step_number?: number;
  reasoning_type?: "analysis" | "synthesis" | "evaluation" | "planning";
}

// Final message output type
export interface MessageOutput extends BaseOutput {
  type: "message";
  id?: string;
  role?: "assistant" | "system";
  status?: "completed";
  content: MessageContent[];
}

// Message content types
export interface MessageContent {
  type: "output_text";
  text: string;
  annotations: Annotation[];
  logprobs?: any[];
}

// Annotation types
export interface Annotation {
  type: "url_citation";
  start_index: number;
  end_index: number;
  title: string;
  url: string;
}

// Legacy citation reference (keeping for backward compatibility)
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
