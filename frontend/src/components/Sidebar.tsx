"use client";

import React, { useState } from "react";
import { ThreadSummary } from "@/types";
import KnowledgeBaseDropzone from "./KnowledgeBaseDropzone";
import {
  Plus,
  Search,
  Trash2,
  Settings,
  X,
  Radio,
  Tag,
  MessageSquareText,
} from "lucide-react";

interface Props {
  threads: ThreadSummary[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  backendOnline: boolean | null;
}

export default function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onOpenSettings,
  isOpen,
  onClose,
  backendOnline,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.thread_id.toLowerCase().includes(q) ||
      (t.last_message && t.last_message.toLowerCase().includes(q))
    );
  });

  const handleDelete = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    if (confirm(`Delete ticket #${threadId}? This will remove all conversation history.`)) {
      setDeletingId(threadId);
      onDeleteThread(threadId);
      setTimeout(() => setDeletingId(null), 500);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#1b2430]/40 z-30 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-[320px] bg-[#d9cbb0] border-r border-[#a9a08c] flex flex-col min-h-0 p-4 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-2xl tracking-tight text-[#1b2430]">
                Cartflow
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#b03a2e] mb-2" />
            </div>
            <span className="text-xs text-[#4a5568] -mt-1 font-mono tracking-wide">
              agentic support desk
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              title="Connection Settings"
              className="p-1.5 text-[#4a5568] hover:text-[#1b2430] hover:bg-[#c7b797] rounded transition-colors"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-[#4a5568] hover:text-[#1b2430] hover:bg-[#c7b797] rounded"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Ticket Button */}
        <button
          onClick={() => {
            onNewThread();
            onClose();
          }}
          type="button"
          className="w-full flex items-center justify-between border-1.5 border-dashed border-[#1b2430] bg-transparent hover:bg-[#f7f3ea] text-[#1b2430] px-3 py-2.5 text-sm font-medium transition-colors mb-3 cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>New Ticket</span>
          </span>
          <span className="text-[10px] font-mono border border-[#1b2430]/30 px-1 py-0.5 rounded text-[#4a5568]">
            #NEW
          </span>
        </button>

        {/* Search / Filter */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
          <input
            type="text"
            placeholder="Filter tickets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#efe9dc] border border-[#a9a08c] text-xs text-[#1b2430] placeholder-[#4a5568]/70 pl-8 pr-2.5 py-1.5 outline-none focus:border-[#1b2430]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#1b2430] text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Threads List Header */}
        <div className="flex items-center justify-between text-xs text-[#4a5568] font-mono px-0.5 mb-2">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Tickets ({threads.length})</span>
          </span>
          {searchQuery && (
            <span className="text-[10.5px]">Matched: {filteredThreads.length}</span>
          )}
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
          {filteredThreads.length === 0 ? (
            <div className="p-3 text-center text-xs text-[#4a5568] border border-dashed border-[#a9a08c]/70 bg-[#efe9dc]/50">
              {threads.length === 0 ? (
                <div className="space-y-1">
                  <MessageSquareText className="w-5 h-5 mx-auto text-[#a9a08c]" />
                  <p>No tickets yet.</p>
                  <p className="text-[11px] text-[#4a5568]/80">Send a message to open one.</p>
                </div>
              ) : (
                <p>No matching tickets found.</p>
              )}
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.thread_id === activeThreadId;
              const isDeleting = deletingId === thread.thread_id;

              return (
                <div
                  key={thread.thread_id}
                  onClick={() => {
                    onSelectThread(thread.thread_id);
                    onClose();
                  }}
                  className={`thread-stub group ${isActive ? "active" : ""} ${
                    isDeleting ? "opacity-50 pointer-events-none" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#1b2430]">
                      #{thread.thread_id}
                    </span>
                    <span className="text-[11px] font-mono text-[#4a5568] bg-[#d9cbb0]/40 px-1 py-0.2 rounded">
                      {thread.message_count} {thread.message_count === 1 ? "msg" : "msgs"}
                    </span>
                  </div>

                  <div className="text-[12px] text-[#4a5568] truncate leading-tight mt-0.5 pr-5">
                    {thread.last_message || "No messages yet"}
                  </div>

                  {/* Delete Thread Button */}
                  <button
                    onClick={(e) => handleDelete(e, thread.thread_id)}
                    title={`Delete ticket #${thread.thread_id}`}
                    className="absolute top-2 right-2 text-[#4a5568] hover:text-[#b03a2e] p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label={`Delete thread ${thread.thread_id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Knowledge Base Section */}
        <KnowledgeBaseDropzone />

        {/* Backend Status Footer */}
        <div className="pt-3 mt-2 border-t border-[#a9a08c] flex items-center justify-between text-xs text-[#4a5568]">
          <div className="flex items-center gap-1.5">
            <Radio
              className={`w-3.5 h-3.5 ${
                backendOnline === true
                  ? "text-[#3c8a53] animate-pulse"
                  : backendOnline === false
                  ? "text-[#b03a2e]"
                  : "text-[#a9a08c]"
              }`}
            />
            <span className="font-mono text-[11px]">
              {backendOnline === true
                ? "Backend Connected"
                : backendOnline === false
                ? "Backend Offline"
                : "Checking Status…"}
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-[11px] font-mono underline hover:text-[#1b2430]"
          >
            Config
          </button>
        </div>
      </aside>
    </>
  );
}
