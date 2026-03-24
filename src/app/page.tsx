"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import DailyBriefing from "@/components/DailyBriefing";
import TriageView from "@/components/TriageView";
import FlagsView from "@/components/FlagsView";
import UploadData from "@/components/UploadData";
import defaultMessages from "@/data/messages.json";
import { AnalysisResult, Message } from "@/lib/types";
import {
  Loader2,
  Brain,
  LayoutDashboard,
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>(defaultMessages as Message[]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (customMessages?: Message[]) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const msgsToAnalyze = customMessages || messages;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgsToAnalyze }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Analysis failed (${res.status})`);
      }

      const data: AnalysisResult = await res.json();
      setAnalysis(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (newMessages: Message[]) => {
    setMessages(newMessages);
    setAnalysis(null);
    runAnalysis(newMessages);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header metadata={analysis?.metadata} />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Warnings */}
        {analysis?.warnings?.map((w, i) => (
          <div
            key={i}
            className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {w}
          </div>
        ))}

        {/* Initial state */}
        {!analysis && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="p-4 rounded-2xl bg-indigo-500/10">
              <Brain className="w-12 h-12 text-indigo-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-100">
                {messages.length} messages awaiting triage
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                3-pass AI analysis across email, Slack, and WhatsApp
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => runAnalysis()} className="gap-2">
                <Brain className="w-5 h-5" />
                Run AI Analysis
              </Button>
              <UploadData onUpload={handleUpload} />
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-zinc-200">
                Analyzing {messages.length} messages...
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Running 3-pass classification, cross-referencing, and briefing generation
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
            <p className="text-red-300">{error}</p>
            <Button variant="outline" onClick={() => runAnalysis()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <>
            <div className="flex justify-end gap-2 mb-4">
              <UploadData onUpload={handleUpload} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAnalysis()}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-analyze
              </Button>
            </div>

            <Tabs defaultValue="briefing" className="w-full" orientation="horizontal">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900" style={{ width: "100%" }}>
                <TabsTrigger value="briefing" className="gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Briefing
                </TabsTrigger>
                <TabsTrigger value="triage" className="gap-1.5">
                  <Shield className="w-4 h-4" />
                  Triage ({analysis.messages.length})
                </TabsTrigger>
                <TabsTrigger value="flags" className="gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Flags ({analysis.flags.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="briefing">
                <DailyBriefing briefing={analysis.briefing} />
              </TabsContent>

              <TabsContent value="triage">
                <TriageView messages={messages} analysis={analysis.messages} />
              </TabsContent>

              <TabsContent value="flags">
                <FlagsView flags={analysis.flags} messages={messages} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
