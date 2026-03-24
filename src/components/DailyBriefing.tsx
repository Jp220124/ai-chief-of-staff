import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BriefingSection } from "@/lib/types";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface DailyBriefingProps {
  briefing: BriefingSection[];
}

const levelConfig = {
  red: {
    icon: AlertTriangle,
    borderColor: "border-l-red-500",
    bgColor: "bg-red-500/5",
    headerBg: "bg-red-500/10",
    headerText: "text-red-400",
    iconColor: "text-red-400",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    actionColor: "text-red-300",
  },
  amber: {
    icon: Clock,
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/5",
    headerBg: "bg-amber-500/10",
    headerText: "text-amber-400",
    iconColor: "text-amber-400",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    actionColor: "text-amber-300",
  },
  green: {
    icon: CheckCircle2,
    borderColor: "border-l-green-500",
    bgColor: "bg-green-500/5",
    headerBg: "bg-green-500/10",
    headerText: "text-green-400",
    iconColor: "text-green-400",
    badgeColor: "bg-green-500/20 text-green-300 border-green-500/30",
    actionColor: "text-green-300",
  },
};

export default function DailyBriefing({ briefing }: DailyBriefingProps) {
  // Handle both array and object formats from Claude
  const briefingArray = Array.isArray(briefing)
    ? briefing
    : typeof briefing === "object" && briefing !== null
    ? Object.values(briefing).flat().filter((b): b is BriefingSection =>
        typeof b === "object" && b !== null && "level" in b && "items" in b
      )
    : [];

  const orderedLevels = ["red", "amber", "green"] as const;
  const orderedBriefing = orderedLevels
    .map((level) => briefingArray.find((b) => b.level === level))
    .filter(Boolean) as BriefingSection[];

  return (
    <div className="space-y-6 mt-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-zinc-100">Morning Briefing</h2>
        <p className="text-sm text-zinc-500 mt-1">20 messages triaged across email, Slack, and WhatsApp</p>
      </div>

      {orderedBriefing.map((section) => {
        const config = levelConfig[section.level];
        const Icon = config.icon;

        return (
          <div key={section.level} className="space-y-3">
            {/* Section header */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${config.headerBg}`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${config.headerText}`}>
                {section.title || (section.level === "red" ? "Requires Immediate Decision" : section.level === "amber" ? "Needs Attention Today" : "Handled / Informational")}
              </h3>
            </div>

            {/* Items */}
            {section.items.map((item, idx) => (
              <Card
                key={idx}
                className={`border-l-4 ${config.borderColor} ${config.bgColor} border-zinc-800`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-100 text-sm">{item.title}</p>
                      <p className="text-sm text-zinc-400 mt-1">{item.detail}</p>
                      {item.action && (
                        <p className={`text-sm font-medium mt-2 ${config.actionColor}`}>
                          {item.action}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {(item.message_ids || []).map((id) => (
                        <Badge
                          key={id}
                          variant="outline"
                          className={`text-xs ${config.badgeColor}`}
                        >
                          #{id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
