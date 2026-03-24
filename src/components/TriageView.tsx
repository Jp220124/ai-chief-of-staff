"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import MessageCard from "./MessageCard";
import { Message, TriagedMessage, Classification } from "@/lib/types";
import { ShieldAlert, Forward, EyeOff, LayoutGrid } from "lucide-react";

interface TriageViewProps {
  messages: Message[];
  analysis: TriagedMessage[];
}

type Filter = "all" | Classification;

export default function TriageView({ messages, analysis }: TriageViewProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const safeAnalysis = Array.isArray(analysis) ? analysis : [];

  const counts = {
    all: safeAnalysis.length,
    decide: safeAnalysis.filter((a) => a.classification === "decide").length,
    delegate: safeAnalysis.filter((a) => a.classification === "delegate").length,
    ignore: safeAnalysis.filter((a) => a.classification === "ignore").length,
  };

  // Sort: critical first, then by urgency, superseded last
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...safeAnalysis].sort((a, b) => {
    if (a.superseded_by && !b.superseded_by) return 1;
    if (!a.superseded_by && b.superseded_by) return -1;
    return (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3);
  });

  const filtered =
    filter === "all"
      ? sorted
      : sorted.filter((a) => a.classification === filter);

  return (
    <div className="space-y-4 mt-6">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="gap-1.5"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          All ({counts.all})
        </Button>
        <Button
          variant={filter === "decide" ? "destructive" : "outline"}
          size="sm"
          onClick={() => setFilter("decide")}
          className="gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Decide ({counts.decide})
        </Button>
        <Button
          variant={filter === "delegate" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("delegate")}
          className="gap-1.5"
        >
          <Forward className="w-3.5 h-3.5" />
          Delegate ({counts.delegate})
        </Button>
        <Button
          variant={filter === "ignore" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFilter("ignore")}
          className="gap-1.5"
        >
          <EyeOff className="w-3.5 h-3.5" />
          Ignore ({counts.ignore})
        </Button>
      </div>

      {/* Message cards */}
      <div className="space-y-3">
        {filtered.map((triage) => {
          const message = messages.find((m) => m.id === triage.message_id);
          if (!message) return null;
          return (
            <MessageCard
              key={message.id}
              message={message}
              triage={triage}
            />
          );
        })}
      </div>
    </div>
  );
}
