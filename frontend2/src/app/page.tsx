"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import Composer from "@/components/Composer";
import SettingsModal from "@/components/SettingsModal";
import {
  checkHealth,
  getThreads,
  getThreadMessages,
  getThreadState,
  sendMessage,
  resumeThread,
  deleteThread,
  ApiError,
} from "@/lib/api";
import { Message, ThreadStateResponse, ThreadSummary } from "@/types";

export default function Home() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [interruptedState, setInterruptedState] =
    useState<ThreadStateResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch threads list
  const refreshThreads = useCallback(async () => {
    try {
      const data = await getThreads();
      setThreads(data);
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }, []);

  // Check backend health
  const verifyHealth = useCallback(async () => {
    const ok = await checkHealth();
    setBackendOnline(ok);
    return ok;
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      const ok = await checkHealth();
      if (!isMounted) return;
      setBackendOnline(ok);

      if (ok) {
        try {
          const list = await getThreads();
          if (isMounted) setThreads(list);
        } catch (err) {
          console.error("Failed to load threads:", err);
        }
      }
    }

    initialize();

    const interval = setInterval(async () => {
      const ok = await checkHealth();
      if (isMounted) setBackendOnline(ok);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Check interrupted checkpoint status
  const checkInterrupted = useCallback(async (threadId: string) => {
    try {
      const state = await getThreadState(threadId);
      setInterruptedState(state.interrupted ? state : null);
    } catch {
      setInterruptedState(null);
    }
  }, []);

  // Select a thread from sidebar
  const handleSelectThread = useCallback(
    async (threadId: string) => {
      setActiveThreadId(threadId);
      setInterruptedState(null);

      try {
        const history = await getThreadMessages(threadId);
        setMessages(history);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not load messages for this thread.";
        setMessages([
          {
            role: "error",
            content: `${msg} Make sure the backend server is running on the configured address.`,
          },
        ]);
      }

      checkInterrupted(threadId);
    },
    [checkInterrupted]
  );

  // Start a new thread
  const handleNewThread = useCallback(() => {
    setActiveThreadId(null);
    setMessages([]);
    setInterruptedState(null);
  }, []);

  // Delete a thread
  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      try {
        await deleteThread(threadId);
        if (activeThreadId === threadId) {
          handleNewThread();
        }
        refreshThreads();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete thread";
        alert(msg);
      }
    },
    [activeThreadId, handleNewThread, refreshThreads]
  );

  // Send a message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    // Optimistically add user message
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const res = await sendMessage(text, activeThreadId);

      // Append agent answer
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: res.answer,
          trace_id: res.trace_id,
        },
      ]);

      if (!activeThreadId) {
        setActiveThreadId(res.thread_id);
      }

      setInterruptedState(null);
      refreshThreads();
    } catch (err: unknown) {
      console.error("Chat error:", err);
      const apiErr = err as ApiError;
      const errorMsg =
        apiErr.message || "Something went wrong communicating with the support agent.";

      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: `${errorMsg} (Please check backend status or resume if a checkpoint was saved).`,
        },
      ]);

      const targetThreadId = apiErr.threadId || activeThreadId;
      if (targetThreadId) {
        if (!activeThreadId) {
          setActiveThreadId(targetThreadId);
        }
        checkInterrupted(targetThreadId);
        refreshThreads();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Resume an interrupted thread
  const handleResumeInterrupted = async () => {
    if (!activeThreadId || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await resumeThread(activeThreadId);
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: res.answer,
          trace_id: res.trace_id,
        },
      ]);
      setInterruptedState(null);
      refreshThreads();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to resume from checkpoint.";
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: `Resume failed: ${msg}`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry last user message
  const handleRetryLast = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#efe9dc]">
      {/* Sidebar */}
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        backendOnline={backendOnline}
      />

      {/* Main Chat Column */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        <ChatArea
          threadId={activeThreadId}
          messages={messages}
          interruptedState={interruptedState}
          isGenerating={isGenerating}
          backendOnline={backendOnline}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onResumeInterrupted={handleResumeInterrupted}
          onRetryLastMessage={handleRetryLast}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
        />

        <Composer
          onSendMessage={handleSendMessage}
          disabled={isGenerating}
          quickPrompts={
            messages.length === 0
              ? [
                  "Where is my order?",
                  "Return policy details",
                  "Cancel open ticket",
                ]
              : []
          }
        />
      </main>

      {/* Connection / URL Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          verifyHealth().then((ok) => {
            if (ok) refreshThreads();
          });
        }}
      />
    </div>
  );
}
