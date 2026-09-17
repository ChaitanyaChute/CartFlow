import {
  ChatResponse,
  Message,
  ThreadMessagesResponse,
  ThreadStateResponse,
  ThreadSummary,
  UploadResponse,
} from "@/types";

const STORAGE_KEY = "cartflow_api_base";
export const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_API_BASE ||
  "http://localhost:8000";

export function getApiBase(): string {
  // If NEXT_PUBLIC_API_BASE or NEXT_API_BASE was explicitly set at build/deploy time to a production URL,
  // use it directly so stale browser localStorage (e.g. from localhost development) doesn't hijack requests.
  const envBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_API_BASE;
  if (envBase && envBase.trim()) {
    return envBase.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, "");
  }
  return DEFAULT_API_BASE.replace(/\/+$/, "");
}

export class ApiError extends Error {
  threadId?: string;
  statusCode?: number;

  constructor(message: string, statusCode?: number, threadId?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.threadId = threadId;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const base = getApiBase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${base}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export async function getThreads(): Promise<ThreadSummary[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/threads`);
  if (!res.ok) {
    throw new ApiError("Failed to fetch threads", res.status);
  }
  return res.json();
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/api/threads/${encodeURIComponent(threadId)}/messages`
  );
  if (!res.ok) {
    throw new ApiError(`Failed to fetch messages for thread ${threadId}`, res.status);
  }
  const data: ThreadMessagesResponse = await res.json();
  return data.messages.map((m) => ({
    role: m.role === "user" ? "user" : "agent",
    content: m.content,
  }));
}

export async function getThreadState(threadId: string): Promise<ThreadStateResponse> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/api/threads/${encodeURIComponent(threadId)}/state`
  );
  if (!res.ok) {
    throw new ApiError(`Failed to fetch state for thread ${threadId}`, res.status);
  }
  return res.json();
}

export async function sendMessage(
  message: string,
  threadId?: string | null
): Promise<ChatResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      thread_id: threadId || null,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      data.detail || "The agent could not process that message.",
      res.status,
      data.thread_id
    );
  }

  return data as ChatResponse;
}

export async function resumeThread(threadId: string): Promise<ChatResponse> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/api/threads/${encodeURIComponent(threadId)}/resume`,
    {
      method: "POST",
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      data.detail || "Could not resume this thread.",
      res.status,
      threadId
    );
  }

  return data as ChatResponse;
}

export async function deleteThread(threadId: string): Promise<void> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/api/threads/${encodeURIComponent(threadId)}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new ApiError(`Failed to delete thread ${threadId}`, res.status);
  }
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const base = getApiBase();
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new ApiError("Only PDF files are supported.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${base}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.detail || "Upload failed.", res.status);
  }

  return data as UploadResponse;
}
