export interface Message {
  role: "user" | "agent" | "assistant" | "system" | "error" | "pending";
  content: string;
  timestamp?: string;
  trace_id?: string;
}

export interface ThreadSummary {
  thread_id: string;
  message_count: number;
  last_message: string | null;
}

export interface ThreadMessagesResponse {
  thread_id: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

export interface ThreadStateResponse {
  thread_id: string;
  exists: boolean;
  interrupted: boolean;
  next_nodes: string[];
}

export interface ChatResponse {
  thread_id: string;
  answer: string;
  resumed: boolean;
  trace_id?: string;
}

export interface UploadResponse {
  filename: string;
  chunks_indexed: number;
  collection: string;
}

export interface HealthResponse {
  status: string;
}
