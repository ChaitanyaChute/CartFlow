"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, ThreadStateResponse } from "@/types";
import {
  Menu,
  Copy,
  Check,
  AlertTriangle,
  Play,
  HelpCircle,
  Package,
  FileQuestion,
  RefreshCw,
  ArrowDown,
  Clock,
} from "lucide-react";

interface Props {
  threadId: string | null;
  messages: Message[];
  interruptedState: ThreadStateResponse | null;
  isGenerating: boolean;
  backendOnline: boolean | null;
  onToggleSidebar: () => void;
  onResumeInterrupted: () => void;
  onRetryLastMessage?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export default function ChatArea({
  threadId,
  messages,
  interruptedState,
  isGenerating,
  backendOnline,
  onToggleSidebar,
  onResumeInterrupted,
  onRetryLastMessage,
  onSelectPrompt,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedThreadId, setCopiedThreadId] = useState(false);

  // Auto-scroll when messages change or while generating
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isGenerating]);

  // Track scroll position to show/hide "Scroll to bottom" floating button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyId = () => {
    if (!threadId) return;
    navigator.clipboard.writeText(threadId);
    setCopiedThreadId(true);
    setTimeout(() => setCopiedThreadId(false), 2000);
  };

  const samplePrompts = [
    {
      icon: <Package className="w-4 h-4 text-[#b03a2e]" />,
      title: "Order Status",
      query: "Can you check the current status and delivery date of my order?",
    },
    {
      icon: <FileQuestion className="w-4 h-4 text-[#b03a2e]" />,
      title: "Return Policy",
      query: "What is your return policy for open-box or damaged items?",
    },
    {
      icon: <Clock className="w-4 h-4 text-[#b03a2e]" />,
      title: "Cancellation Window",
      query: "How soon can I cancel or change an order after placing it?",
    },
    {
      icon: <HelpCircle className="w-4 h-4 text-[#b03a2e]" />,
      title: "International Shipping",
      query: "Do you ship internationally and what are the customs fees?",
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#efe9dc] relative">
      {/* Header */}
      <header className="px-4 md:px-6 py-3.5 border-b border-[#a9a08c] flex items-center justify-between bg-[#efe9dc]/90 backdrop-blur-xs shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 -ml-1 border border-[#a9a08c] bg-[#f7f3ea] text-[#1b2430] hover:bg-[#d9cbb0] rounded-xs"
            aria-label="Toggle sidebar drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm md:text-base text-[#1b2430]">
                {threadId ? `Ticket #${threadId}` : "New Ticket"}
              </span>
              {threadId && (
                <button
                  onClick={copyId}
                  title="Copy ticket ID"
                  className="p-1 text-[#4a5568] hover:text-[#1b2430] rounded transition-colors"
                >
                  {copiedThreadId ? (
                    <Check className="w-3.5 h-3.5 text-[#2f5d3a]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-[#4a5568] truncate leading-tight mt-0.5">
              {threadId
                ? "Active conversation session — context persisted in memory"
                : "Not saved yet — send a message to open a ticket"}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#a9a08c] bg-[#f7f3ea] text-[11.5px] font-mono text-[#4a5568]">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-[#3c8a53] animate-pulse"
                  : backendOnline === false
                  ? "bg-[#b03a2e]"
                  : "bg-[#a9a08c]"
              }`}
            />
            <span className="hidden sm:inline">
              {backendOnline === true
                ? "Online"
                : backendOnline === false
                ? "Unreachable"
                : "Checking…"}
            </span>
          </div>
        </div>
      </header>

      {/* Interrupted Checkpoint Banner (if LangGraph stopped mid-graph) */}
      {interruptedState?.interrupted && (
        <div className="mx-4 md:mx-6 mt-4 p-3.5 bg-[#f7f3ea] border-2 border-[#b03a2e] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#b03a2e] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs md:text-sm text-[#1b2430]">
                Agent run was interrupted mid-execution
              </div>
              <div className="text-xs text-[#4a5568] mt-0.5 font-mono">
                Stopped before nodes:{" "}
                <span className="text-[#8f2e24] font-bold">
                  {interruptedState.next_nodes.join(", ") || "pending"}
                </span>
                . Checkpoint is saved.
              </div>
            </div>
          </div>
          <button
            onClick={onResumeInterrupted}
            disabled={isGenerating}
            className="px-3.5 py-1.5 bg-[#1b2430] hover:bg-[#4a5568] disabled:opacity-50 text-[#efe9dc] text-xs font-mono font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Checkpoint</span>
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0"
        aria-live="polite"
      >
        {/* Empty State */}
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#d9cbb0] flex items-center justify-center border border-[#a9a08c]">
              <Package className="w-6 h-6 text-[#1b2430]" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#1b2430] mb-1">
              Welcome to Cartflow Support
            </h3>
            <p className="text-sm text-[#4a5568] mb-6 leading-relaxed">
              Ask about an order, shipment tracking, returns, or store policies.
              Answers are synthesized using LangGraph multi-turn agent reasoning and indexed RAG documents.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt && onSelectPrompt(p.query)}
                  className="p-3 bg-[#f7f3ea] hover:bg-[#fffdf8] border border-[#a9a08c] hover:border-[#1b2430] rounded-xs transition-all duration-150 group text-left cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {p.icon}
                    <span className="font-medium text-xs text-[#1b2430] group-hover:text-[#b03a2e] transition-colors">
                      {p.title}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#4a5568] line-clamp-2 leading-tight">
                    {p.query}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isError = msg.role === "error";

            return (
              <div
                key={index}
                className={`bubble-rise flex ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] md:max-w-[75%] rounded-xs px-4 py-3 relative group text-[14.5px] leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-[#1b2430] text-[#efe9dc]"
                      : isError
                      ? "bg-[#f7f3ea] border-1.5 border-[#b03a2e] text-[#8f2e24]"
                      : "bg-[#f7f3ea] border border-[#a9a08c] text-[#1b2430]"
                  }`}
                >
                  {/* Role Tag & Actions */}
                  <div className="flex items-center justify-between gap-3 mb-1 text-[11px] font-mono border-b border-black/10 pb-1 opacity-75">
                    <span className="uppercase tracking-wider font-semibold">
                      {isUser ? "Customer" : isError ? "Error Alert" : "Support Agent"}
                    </span>
                    {!isUser && !isError && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(msg.content, index)}
                          title="Copy message"
                          className="hover:text-[#1b2430] p-0.5"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-[#2f5d3a]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  ) : isError ? (
                    <div>
                      <div className="font-mono text-xs whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      {onRetryLastMessage && (
                        <button
                          onClick={onRetryLastMessage}
                          disabled={isGenerating}
                          className="mt-2 text-xs font-semibold underline text-[#b03a2e] hover:text-[#8f2e24] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry request
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="prose-agent">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Generating / Thinking Indicator */}
        {isGenerating && (
          <div className="bubble-rise flex justify-start">
            <div className="max-w-[75%] rounded-xs px-4 py-3 bg-[#f7f3ea] border border-[#a9a08c] shadow-xs">
              <div className="text-[11px] font-mono text-[#4a5568] uppercase tracking-wider mb-1">
                Support Agent
              </div>
              <div className="flex items-center gap-2 text-xs text-[#4a5568] font-mono">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b03a2e] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b03a2e] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b03a2e] animate-bounce" />
                </span>
                <span>Synthesizing response & policy lookup…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-6 p-2 rounded-full bg-[#1b2430] text-[#efe9dc] shadow-md hover:bg-[#4a5568] transition-all z-20 flex items-center gap-1 text-xs font-mono"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
