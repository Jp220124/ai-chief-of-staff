"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChannelIcon from "./ChannelIcon";
import ClassificationBadge from "./ClassificationBadge";
import { Message, TriagedMessage } from "@/lib/types";
import { ChevronDown, ChevronUp, Clock, AlertTriangle, User } from "lucide-react";

interface MessageCardProps {
  message: Message;
  triage?: TriagedMessage;
}

export default function MessageCard({ message, triage }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isSuperseded = triage?.superseded_by != null;

  const channelBg: Record<string, string> = {
    email: "border-l-blue-500/50",
    slack: "border-l-purple-500/50",
    whatsapp: "border-l-green-500/50",
  };

  const urgencyColor: Record<string, string> = {
    critical: "bg-red-500/10 border-red-500/30",
    high: "bg-amber-500/10 border-amber-500/30",
    medium: "bg-zinc-800 border-zinc-700",
    low: "bg-zinc-900 border-zinc-800",
  };

  const time = new Date(message.timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      className={`border-l-4 ${channelBg[message.channel] || ""} ${
        triage ? urgencyColor[triage.urgency] || "" : "bg-zinc-900 border-zinc-800"
      } ${isSuperseded ? "opacity-50" : ""} cursor-pointer transition-all hover:border-zinc-600`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <ChannelIcon channel={message.channel} />
            <span className="text-sm font-medium text-zinc-200">{message.from}</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time}
            </span>
            {isSuperseded && (
              <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                Superseded by #{triage.superseded_by}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {triage && <ClassificationBadge classification={triage.classification} />}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </div>

        {/* Subject (email only) */}
        {message.subject && (
          <p className="text-sm font-medium text-zinc-300 mt-2">{message.subject}</p>
        )}

        {/* Content preview */}
        <p className={`text-sm text-zinc-400 mt-2 ${expanded ? "" : "line-clamp-2"}`}>
          {message.body}
        </p>

        {/* Expanded section */}
        {expanded && triage && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
            {/* AI Reasoning */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">AI Reasoning</p>
              <p className="text-sm text-zinc-300">{triage.reason}</p>
            </div>

            {/* Delegate to */}
            {triage.delegate_to && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300 font-medium">Delegate to: {triage.delegate_to}</span>
              </div>
            )}

            {/* Flags */}
            {Array.isArray(triage.flags) && triage.flags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {triage.flags.map((flag, i) => (
                  <Badge key={i} variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {flag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Related messages */}
            {Array.isArray(triage.related_messages) && triage.related_messages.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Related Messages</p>
                <div className="flex gap-1.5 flex-wrap">
                  {triage.related_messages.map((id) => (
                    <Badge key={id} variant="outline" className="text-xs">
                      #{id}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Deadline */}
            {triage.deadline && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Clock className="w-4 h-4" />
                <span>Deadline: {triage.deadline}</span>
              </div>
            )}

            {/* Draft response */}
            {triage.draft_response && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Draft Response</p>
                <div className={`p-3 rounded-md text-sm whitespace-pre-wrap ${
                  message.channel === "email"
                    ? "bg-blue-500/5 border border-blue-500/20 text-blue-200"
                    : message.channel === "slack"
                    ? "bg-purple-500/5 border border-purple-500/20 text-purple-200"
                    : "bg-green-500/5 border border-green-500/20 text-green-200"
                }`}>
                  {triage.draft_response}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
