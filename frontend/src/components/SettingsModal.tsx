"use client";

import React, { useState } from "react";
import { getApiBase } from "@/lib/api";
import { X, Server, RefreshCw } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;
  return <SettingsModalDialog onClose={onClose} />;
}

function SettingsModalDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const [url] = useState(() => getApiBase());
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
          <p className="text-xs text-[#4a5568] leading-relaxed">
            Test and verify the live connection to the CartFlow backend service:
          </p>

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
                className="px-4 py-1.5 bg-[#1b2430] text-[#efe9dc] hover:bg-[#4a5568] text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
