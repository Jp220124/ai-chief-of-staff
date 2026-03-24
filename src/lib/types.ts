export type Channel = "email" | "slack" | "whatsapp";
export type Classification = "ignore" | "delegate" | "decide";
export type Urgency = "critical" | "high" | "medium" | "low";
export type Severity = "critical" | "warning" | "info";
export type BriefingLevel = "red" | "amber" | "green";

export interface Message {
  id: number;
  channel: Channel;
  from: string;
  to?: string;
  subject?: string;
  timestamp: string;
  body: string;
  channel_name?: string;
}

export interface TriagedMessage {
  message_id: number;
  classification: Classification;
  reason: string;
  confidence: number;
  related_messages: number[];
  flags: string[];
  draft_response: string;
  action_required?: string;
  deadline?: string;
  urgency: Urgency;
  superseded_by?: number;
  delegate_to?: string;
}

export interface Flag {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  affected_messages: number[];
  recommendation: string;
}

export interface BriefingItem {
  title: string;
  detail: string;
  message_ids: number[];
  action: string;
}

export interface BriefingSection {
  level: BriefingLevel;
  title: string;
  items: BriefingItem[];
}

export interface AnalysisMetadata {
  pass1_tokens: number;
  pass2_tokens: number;
  pass3_tokens: number;
  total_tokens: number;
  total_time_ms: number;
}

export interface AnalysisResult {
  messages: TriagedMessage[];
  flags: Flag[];
  briefing: BriefingSection[];
  metadata: AnalysisMetadata;
  warnings?: string[];
}
