// Hookdeck API types for API version 2025-07-01

export interface HookdeckConnection {
  id: string;
  name: string;
  source: HookdeckSource;
  destination: HookdeckDestination;
  rules?: HookdeckRule[];
  created_at: string;
  updated_at: string;
}

export interface HookdeckSource {
  id: string;
  name: string;
  url: string;
  allowed_http_methods?: string[];
  custom_response?: {
    content_type: string;
    body: string;
  };
  verification?: {
    type: string;
  };
}

export interface HookdeckDestination {
  id: string;
  name: string;
  url: string;
  auth_method?: {
    type: string;
    config: Record<string, any>;
  };
}

export interface HookdeckRule {
  type: string;
  body_json?: Record<string, any>;
}

export interface HookdeckEvent {
  id: string;
  source: {
    name: string;
  };
  connection: {
    name: string;
  };
  status: string;
  created_at: string;
  data: any;
}

export interface BasicAuthCredentials {
  username: string;
  password: string;
  encoded: string;
}

export interface StoredConnections {
  queue: {
    id: string;
    sourceUrl: string;
  };
  webhook: {
    id: string;
    sourceUrl: string;
  };
}