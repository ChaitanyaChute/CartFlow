"use client";

import React, { useState, useRef } from "react";
import { uploadDocument } from "@/lib/api";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  onUploadSuccess?: (filename: string, chunks: number) => void;
}

export default function KnowledgeBaseDropzone({ onUploadSuccess }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    text: string;
    type: "ok" | "err" | "info" | null;
  }>({ text: "", type: null });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({
        text: "Only PDF files are supported by the knowledge base.",
        type: "err",
      });
      return;
    }

    setIsUploading(true);
    setStatus({
      text: `Embedding ${file.name}…`,
      type: "info",
    });

    try {
      const res = await uploadDocument(file);
      setStatus({
        text: `Indexed ${res.filename} (${res.chunks_indexed} chunks added)`,
        type: "ok",
      });
      if (onUploadSuccess) {
        onUploadSuccess(res.filename, res.chunks_indexed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setStatus({
        text: msg,
        type: "err",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="border-t border-[#a9a08c] pt-4 mt-4">
      <div className="text-[13px] text-[#4a5568] font-medium mb-2 flex items-center justify-between">
        <span>Knowledge Base</span>
        <span className="text-[11px] font-mono bg-[#c7b797]/40 px-1.5 py-0.5 rounded text-[#1b2430]">
          RAG / PDF
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-1.5 border-dashed rounded-sm p-3.5 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-1.5 ${
          isDragOver
            ? "border-[#b03a2e] bg-[#f7f3ea] text-[#1b2430]"
            : "border-[#a9a08c] bg-transparent text-[#4a5568] hover:border-[#1b2430] hover:bg-[#efe9dc]/50"
        } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF knowledge base document"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-[#b03a2e]" />
        ) : (
          <Upload className="w-4 h-4 text-[#4a5568]" />
        )}

        <div className="text-[12.5px] leading-tight font-medium">
          {isUploading ? (
            <span>Processing document…</span>
          ) : (
            <span>
              Drop PDF here or <span className="text-[#b03a2e] underline font-semibold">browse</span>
            </span>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-[#4a5568] mt-2 leading-tight">
        PDFs are indexed into Chroma vector DB for policy & knowledge retrieval.
      </p>

      {status.text && (
        <div
          className={`mt-2.5 text-[12px] p-2 rounded flex items-start gap-1.5 border ${
            status.type === "ok"
              ? "bg-[#2f5d3a]/10 border-[#2f5d3a]/30 text-[#2f5d3a]"
              : status.type === "err"
              ? "bg-[#b03a2e]/10 border-[#b03a2e]/30 text-[#8f2e24]"
              : "bg-[#1b2430]/5 border-[#a9a08c] text-[#1b2430]"
          }`}
          aria-live="polite"
        >
          {status.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : status.type === "err" ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <FileText className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span className="break-all font-mono leading-tight">{status.text}</span>
        </div>
      )}
    </div>
  );
}
