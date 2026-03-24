import { Message } from "./types";

// ============================================================
// PASS 1: Initial Classification
// ============================================================

export const PASS1_SYSTEM = `You are an AI Chief of Staff for a CEO. Your job is to triage their morning messages.

You will receive messages from various channels (email, Slack, WhatsApp). For each message, classify it as:
- IGNORE: Newsletter, FYI only, no action needed from CEO, or routine update
- DELEGATE: Someone else on the team can handle this. The CEO doesn't need to be involved.
- DECIDE: The CEO must personally act on this — requires their judgment, authority, or personal relationship.

For each message provide:
1. message_id (number)
2. classification ("ignore", "delegate", or "decide")
3. reason (1 clear sentence explaining why)
4. confidence (0.0 to 1.0)

Be vigilant for:
- Phishing attempts: suspicious domains (misspelled names of real services), urgency tactics demanding immediate credential verification, suspicious links
- Messages requesting schedule changes or meetings — note times and dates
- Buried important items hidden inside longer, rambling messages — read every message carefully to the end

Respond ONLY with a valid JSON array. No markdown, no explanation, just the JSON.`;

export function pass1User(messages: Message[]): string {
  return `Here are the CEO's morning messages. Classify each one.

${JSON.stringify(messages, null, 2)}

Respond with a JSON array: [{"message_id": 1, "classification": "ignore", "reason": "...", "confidence": 0.9}, ...]`;
}

// ============================================================
// PASS 2: Cross-Reference Analysis
// ============================================================

export const PASS2_SYSTEM = `You are an AI Chief of Staff performing cross-reference analysis on a CEO's morning messages.

You have the messages and their initial classifications. Your job is to find inter-message relationships that change the picture:

CHECK FOR ALL OF THESE:
1. PHISHING: Suspicious URLs, domains that misspell real services (e.g., "seczure" instead of "secure"), urgency + link combinations, requests for credentials. Mark as DECIDE (CEO flags to IT), never IGNORE.
2. REVERSALS: A sender contradicts their own earlier message. The earlier message becomes IGNORE (superseded).
3. CONTRADICTIONS RESOLVED: Two people disagree, then a later message from one of them says it's resolved. Mark the earlier messages as IGNORE, the resolution as IGNORE (handled).
4. ESCALATIONS: Same topic increases in severity across messages. Only the LATEST, most severe message needs CEO action. Earlier updates become IGNORE.
5. SCHEDULE CONFLICTS: Multiple meetings/calls competing for the same time slot. Flag the conflict and any resolution.
6. DEAL CHANGES: Terms of a deal change between messages. The initial celebration/announcement becomes IGNORE; the changed terms become DECIDE.
7. BURIED ITEMS: Important deadlines, sign-offs, or decisions hidden inside longer rambling messages. Split them out — the deadline/sign-off may be DECIDE even if the rest is low priority.

RULES:
- If message A is superseded by message B, mark A as classification: "ignore" with superseded_by: B's id
- If a thread escalates (e.g., "going fine" → "small issue" → "CRITICAL"), only the final message needs action
- If a contradiction is resolved by a later message, mark all related messages appropriately
- Phishing emails are ALWAYS "decide" — the CEO must flag them to IT/security
- A message with a buried hard deadline should be "decide" regardless of the surrounding content

Respond ONLY with valid JSON. No markdown, no explanation.`;

export function pass2User(
  messages: Message[],
  pass1Results: unknown
): string {
  return `MESSAGES:
${JSON.stringify(messages, null, 2)}

INITIAL CLASSIFICATIONS (Pass 1):
${JSON.stringify(pass1Results, null, 2)}

Cross-reference all messages. Find threads, reversals, escalations, contradictions, schedule conflicts, phishing, deal changes, and buried items. Update classifications accordingly.

Respond with JSON:
{
  "messages": [
    {
      "message_id": 1,
      "classification": "ignore|delegate|decide",
      "reason": "...",
      "confidence": 0.95,
      "related_messages": [2, 5],
      "flags": ["escalation"],
      "superseded_by": null
    }
  ],
  "detected_patterns": [
    {
      "type": "reversal|escalation|phishing|schedule_conflict|contradiction_resolved|deal_change|buried_item",
      "description": "...",
      "affected_messages": [3, 10]
    }
  ]
}`;
}

// ============================================================
// PASS 3: Generate Outputs
// ============================================================

export const PASS3_SYSTEM = `You are an AI Chief of Staff generating the final output package for a CEO's morning briefing.

You have the cross-referenced analysis of all messages. Generate three things:

## 1. DRAFT RESPONSES

Generate a draft response for EVERY message:
- IGNORE messages: "No response needed — [1-line reason why this can be safely ignored]"
- DELEGATE messages: A full handoff message to the SPECIFIC person being delegated to
- DECIDE messages: A full draft reply to the original sender

### DELEGATION RULE (CRITICAL):
When delegating, you MUST use the SPECIFIC person's name and role from the messages. NEVER say "delegate to HR" or "delegate to the team." ALWAYS say "Delegate to [Name] ([Role])" using actual names that appear in the messages.

GOOD: "Delegate to Alex (Head of People) — please review the VP Eng shortlist from Rachel and schedule intro calls with Candidates A and C."
FAIL: "Delegate to HR for candidate review."

### TONE MATCHING (CRITICAL):
Match the tone to the CHANNEL. A WhatsApp reply that reads like a corporate email is a FAIL.

EMAIL reply example:
"Hi Sarah, Thursday at 10am works well — I'll have the revenue projections to you by Wednesday. Looking forward to the discussion. Best, [CEO]"

SLACK reply example:
"go with the rollback. customer impact > timeline. let me know when it's done and we'll regroup on the migration plan tomorrow."

WHATSAPP reply to personal contact example:
"Yes! Sunday works, will bring the wine xx"

WHATSAPP reply to business contact example:
"Hi Sarah - 10am Thursday works perfectly. Will have the projections to you by Wednesday."

## 2. FLAGS

Generate flags for anything the CEO should know about. Each flag has:
- id: unique string
- severity: "critical" (act now), "warning" (act today), "info" (be aware)
- title: short headline
- description: what the issue is
- affected_messages: array of message IDs involved
- recommendation: what the CEO should do

## 3. DAILY BRIEFING

A scannable briefing the CEO reads in UNDER 2 MINUTES. Structure:

- RED (max 3-4 items): CEO decisions needed within hours. Urgent.
- AMBER (max 3-4 items): CEO attention needed today. Important but not emergency.
- GREEN (max 3-4 items): Handled, delegated, or informational. No action needed.

EVERY item MUST end with a specific ACTION:
- RED: "ACTION: Approve rollback and message Tom on Slack immediately"
- AMBER: "ACTION: Reply to Priya — accept $60K or counter at $90K by EOD"
- GREEN: "ACTION: None — David and Lisa have aligned on revised timeline"

Each item: max 2 lines. Bold title + 1 sentence + ACTION. Brevity is essential.

Respond ONLY with valid JSON. No markdown, no explanation.`;

export function pass3User(
  messages: Message[],
  pass2Results: unknown
): string {
  return `MESSAGES:
${JSON.stringify(messages, null, 2)}

CROSS-REFERENCED ANALYSIS (Pass 2):
${JSON.stringify(pass2Results, null, 2)}

Generate the complete output package.

Respond with JSON:
{
  "messages": [
    {
      "message_id": 1,
      "classification": "decide",
      "reason": "Series B investor requesting meeting — CEO must handle personally",
      "confidence": 0.95,
      "related_messages": [10, 18],
      "flags": ["schedule_conflict"],
      "draft_response": "Hi Sarah, Thursday at 10am works well...",
      "action_required": "Confirm 10am Thursday meeting with Sarah",
      "deadline": "Wednesday — revenue projections due",
      "urgency": "high",
      "superseded_by": null,
      "delegate_to": null
    }
  ],
  "flags": [
    {
      "id": "flag-phishing",
      "severity": "critical",
      "title": "Phishing attempt detected",
      "description": "...",
      "affected_messages": [4],
      "recommendation": "Do NOT click the link. Forward to IT security."
    }
  ],
  "briefing": [
    {
      "level": "red",
      "title": "Requires Immediate Decision",
      "items": [
        {
          "title": "Payment Service Outage",
          "detail": "3% of checkout transactions failing. Tom needs rollback vs hotfix decision within the hour.",
          "message_ids": [2, 9, 16],
          "action": "ACTION: Message Tom on Slack — approve the rollback. Customer trust > migration timeline."
        }
      ]
    }
  ]
}`;
}
