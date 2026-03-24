import { Brain, Zap } from "lucide-react";
import { AnalysisMetadata } from "@/lib/types";

interface HeaderProps {
  metadata?: AnalysisMetadata;
}

export default function Header({ metadata }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">AI Chief of Staff</h1>
              <p className="text-xs text-zinc-500">Morning Briefing — March 18, 2026</p>
            </div>
          </div>
          {metadata && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>3 passes</span>
              <span className="text-zinc-700">|</span>
              <span>{metadata.total_tokens.toLocaleString()} tokens</span>
              <span className="text-zinc-700">|</span>
              <span>{(metadata.total_time_ms / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
