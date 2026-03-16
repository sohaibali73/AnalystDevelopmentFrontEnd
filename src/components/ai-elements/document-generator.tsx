"use client";

import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentGeneratorProps {
  title: string;
  content: string;
  onDocumentGenerated?: (artifact: any) => void;
}

const styleOptions = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
  { value: "creative", label: "Creative" },
];

export function DocumentGenerator({
  title,
  content,
  onDocumentGenerated,
}: DocumentGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tools/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          format: "document",
          style: selectedStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate document");
      }

      const data = await response.json();

      if (data.success && data.artifact && onDocumentGenerated) {
        onDocumentGenerated(data.artifact);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      console.error("[DocumentGenerator]", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "12px 16px",
        backgroundColor: "rgba(254, 192, 15, 0.05)",
        borderRadius: "8px",
        border: "1px solid rgba(254, 192, 15, 0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FileText size={18} color="#FEC00F" />
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "inherit",
          }}
        >
          Generate Document
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
          Style:
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {styleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStyle(option.value)}
              style={{
                padding: "6px 10px",
                backgroundColor:
                  selectedStyle === option.value
                    ? "#FEC00F"
                    : "transparent",
                color:
                  selectedStyle === option.value
                    ? "#212121"
                    : "inherit",
                border:
                  selectedStyle === option.value
                    ? "none"
                    : "1px solid rgba(254, 192, 15, 0.3)",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#DC262620",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#DC2626",
            border: "1px solid #DC262640",
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleGenerateDocument}
        disabled={isLoading}
        style={{
          padding: "8px 16px",
          backgroundColor: isLoading ? "rgba(254, 192, 15, 0.5)" : "#FEC00F",
          color: "#212121",
          border: "none",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: isLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "all 0.2s ease",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            Generating...
          </>
        ) : (
          <>
            <FileText size={14} />
            Generate Document
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
