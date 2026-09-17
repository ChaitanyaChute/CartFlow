"use client";

import React, { useState, useRef, useEffect } from "react";
import { CornerDownLeft, Sparkles } from "lucide-react";

interface Props {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
  quickPrompts?: string[];
}

export default function Composer({
  onSendMessage,
  disabled,
  placeholder = "Type your question or order inquiry…",
  quickPrompts = [],
}: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[#a9a08c] bg-[#efe9dc] p-3 md:p-4 shrink-0">
      {/* Quick Prompts Chips if available and input is empty */}
      {quickPrompts.length > 0 && !text && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-none">
          <span className="text-[11px] font-mono text-[#4a5568] flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#b03a2e]" /> Quick:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setText(prompt);
                textareaRef.current?.focus();
              }}
              className="text-[11.5px] font-body bg-[#f7f3ea] hover:bg-[#fffdf8] border border-[#a9a08c] text-[#1b2430] px-2.5 py-1 rounded-sm whitespace-nowrap cursor-pointer transition-colors shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2.5 items-end">
        <div className="flex-1 relative bg-[#f7f3ea] border border-[#a9a08c] focus-within:border-[#1b2430] transition-colors rounded-xs">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            aria-label="Message composer input"
            className="w-full bg-transparent px-3.5 py-2.5 text-sm md:text-[14.5px] text-[#1b2430] placeholder-[#4a5568]/70 resize-none outline-none max-h-[140px] leading-relaxed disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="h-[42px] px-4 md:px-5 bg-[#b03a2e] hover:bg-[#8f2e24] disabled:bg-[#c7b797] text-[#fff5ef] disabled:text-[#4a5568] font-medium text-sm rounded-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs"
          title="Send message (Enter)"
        >
          <span>Send</span>
          <CornerDownLeft className="w-3.5 h-3.5 hidden sm:inline" />
        </button>
      </form>
    </div>
  );
}
