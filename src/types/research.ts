export interface Research {
  id: string;
  question: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'incomplete';
  progress?: number;
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  webhookUrl?: string;
  openaiRequestId?: string;
}

export interface CreateResearchRequest {
  question: string;
}

export interface ResearchListResponse {
  researches: Research[];
}

export interface OpenAIWebhookPayload {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}