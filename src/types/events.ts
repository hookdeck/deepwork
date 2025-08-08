/**
 * Event timeline interface for displaying correlated events
 */
export interface EventTimeline {
  id: string;
  type: "outbound" | "inbound";
  status: string;
  timestamp: string;
  data: any;
}

/**
 * Hookdeck event structure from API
 */
export interface HookdeckEvent {
  id: string;
  source: {
    id: string;
    name: string;
  };
  connection: {
    id: string;
    name: string;
  };
  destination: {
    id: string;
    name: string;
  };
  status: string;
  created_at: string;
  data: any;
}

/**
 * Event formatting utilities
 */
export const formatEventType = (type: "outbound" | "inbound"): string => {
  return type === "outbound" ? "Sent to OpenAI" : "Received from OpenAI";
};

export const formatEventStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    SUCCESS: "Success",
    FAILED: "Failed",
    PENDING: "Pending",
    RETRY: "Retrying",
  };
  return statusMap[status] || status;
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  });
};
