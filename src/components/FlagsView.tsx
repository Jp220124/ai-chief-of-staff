import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, Message } from "@/lib/types";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface FlagsViewProps {
  flags: Flag[];
  messages: Message[];
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    borderColor: "border-l-red-500",
    bgColor: "bg-red-500/5",
    badgeVariant: "destructive" as const,
    iconColor: "text-red-400",
  },
  warning: {
    icon: AlertCircle,
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/5",
    badgeVariant: "default" as const,
    iconColor: "text-amber-400",
  },
  info: {
    icon: Info,
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-500/5",
    badgeVariant: "secondary" as const,
    iconColor: "text-blue-400",
  },
};

export default function FlagsView({ flags, messages }: FlagsViewProps) {
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...flags].sort(
    (a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2)
  );

  return (
    <div className="space-y-4 mt-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-zinc-100">Detected Flags</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {flags.filter((f) => f.severity === "critical").length} critical,{" "}
          {flags.filter((f) => f.severity === "warning").length} warnings,{" "}
          {flags.filter((f) => f.severity === "info").length} informational
        </p>
      </div>

      {sorted.map((flag) => {
        const config = severityConfig[flag.severity];
        const Icon = config.icon;

        return (
          <Card
            key={flag.id}
            className={`border-l-4 ${config.borderColor} ${config.bgColor} border-zinc-800`}
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-zinc-100">{flag.title}</h3>
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {flag.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">{flag.description}</p>

                  {/* Affected messages */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-zinc-500">Affected:</span>
                    <div className="flex gap-1 flex-wrap">
                      {(flag.affected_messages || []).map((id) => {
                        const msg = messages.find((m) => m.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="outline"
                            className="text-xs cursor-help"
                            title={msg ? `${msg.from}: ${msg.body.slice(0, 50)}...` : ""}
                          >
                            #{id}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-3 rounded-md bg-zinc-800/50 border border-zinc-700">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                      Recommendation
                    </p>
                    <p className="text-sm text-zinc-200">{flag.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
