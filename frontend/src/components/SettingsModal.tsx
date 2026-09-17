"use client";

import React, { useState } from "react";
import { getApiBase, setApiBase, DEFAULT_API_BASE } from "@/lib/api";
import { X, Check, Server, RefreshCw, RotateCcw } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSaved }: Props) {
  if (!isOpen) return null;
  return <SettingsModalDialog onClose={onClose} onSaved={onSaved} />;
}

function SettingsModalDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState(() => getApiBase());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${url.replace(/\/+$/, "")}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setTestResult({ ok: true, message: "Backend is reachable & healthy!" });
      } else {
        setTestResult({
          ok: false,
          message: `Backend returned status ${res.status}`,
        });
      }
    } catch {
      setTestResult({
        ok: false,
        message: "Failed to connect to backend at this address.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBase(url.trim());
    onSaved();
    onClose();
  };

  const handleReset = () => {
    setUrl(DEFAULT_API_BASE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b2430]/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-[#efe9dc] border-2 border-[#1b2430] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#a9a08c] mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#b03a2e]" />
            <h2 id="modal-title" className="font-display font-bold text-lg text-[#1b2430]">
              Backend Connection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#4a5568] hover:text-[#1b2430] p-1 rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#4a5568] mb-1">
              API Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 bg-[#f7f3ea] border border-[#a9a08c] px-3 py-2 text-sm font-mono text-[#1b2430] focus:border-[#1b2430] outline-none"
              />
              <button
                type="button"
                onClick={handleReset}
                title="Reset to default URL"
                className="px-2.5 py-2 border border-[#a9a08c] bg-[#d9cbb0] hover:bg-[#c7b797] text-[#1b2430] text-xs font-mono transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11.5px] text-[#4a5568] mt-1.5">
              Default: <code className="font-mono bg-[#d9cbb0]/40 px-1 py-0.5 rounded">{DEFAULT_API_BASE}</code>
            </p>
          </div>

          {testResult && (
            <div
              className={`text-xs p-2.5 rounded font-mono border ${
                testResult.ok
                  ? "bg-[#2f5d3a]/15 text-[#2f5d3a] border-[#2f5d3a]/30"
                  : "bg-[#b03a2e]/15 text-[#8f2e24] border-[#b03a2e]/30"
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#a9a08c]">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="px-3 py-1.5 border border-[#1b2430] text-xs font-medium text-[#1b2430] hover:bg-[#d9cbb0] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              {testing ? "Testing…" : "Test Ping"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#4a5568] hover:text-[#1b2430]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-[#b03a2e] text-[#fff5ef] hover:bg-[#8f2e24] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
