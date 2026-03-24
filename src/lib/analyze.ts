import Anthropic from "@anthropic-ai/sdk";
import { Message, AnalysisResult, TriagedMessage } from "./types";
import { extractJSON } from "./extract-json";
import {
  PASS1_SYSTEM,
  pass1User,
  PASS2_SYSTEM,
  pass2User,
  PASS3_SYSTEM,
  pass3User,
} from "./prompts";

const MODEL = "claude-sonnet-4-20250514";

export async function analyzeMessages(
  messages: Message[]
): Promise<AnalysisResult> {
  const client = new Anthropic();
  const startTime = Date.now();
  const warnings: string[] = [];

  // ---- PASS 1: Initial Classification ----
  const pass1 = await callClaude(
    client,
    PASS1_SYSTEM,
    pass1User(messages),
    4096
  );
  const pass1Result = JSON.parse(pass1.text);
  console.log(`Pass 1 complete: ${pass1.tokens} tokens`);

  // ---- PASS 2: Cross-Reference ----
  let pass2Messages: Record<number, Partial<TriagedMessage>> = {};
  let pass2Tokens = 0;
  let pass2Result;
  try {
    const pass2 = await callClaude(
      client,
      PASS2_SYSTEM,
      pass2User(messages, pass1Result),
      8192
    );
    pass2Result = JSON.parse(pass2.text);
    pass2Tokens = pass2.tokens;
    console.log(`Pass 2 complete: ${pass2Tokens} tokens`);

    // Index Pass 2 messages by message_id
    const p2msgs = Array.isArray(pass2Result.messages) ? pass2Result.messages : pass2Result;
    for (const m of (Array.isArray(p2msgs) ? p2msgs : [])) {
      if (m.message_id) pass2Messages[m.message_id] = m;
    }
  } catch (error) {
    console.error("Pass 2 failed, using Pass 1 results:", error);
    warnings.push("Cross-referencing unavailable — showing initial classifications only.");
    pass2Result = { messages: pass1Result, detected_patterns: [] };
    for (const m of (Array.isArray(pass1Result) ? pass1Result : [])) {
      if (m.message_id) pass2Messages[m.message_id] = m;
    }
  }

  // ---- PASS 3: Generate Outputs ----
  let pass3Result: { messages?: unknown[]; flags?: unknown[]; briefing?: unknown[] } = {};
  let pass3Tokens = 0;
  try {
    const pass3 = await callClaude(
      client,
      PASS3_SYSTEM,
      pass3User(messages, pass2Result),
      8192
    );
    pass3Result = JSON.parse(pass3.text);
    pass3Tokens = pass3.tokens;
    console.log(`Pass 3 complete: ${pass3Tokens} tokens. Keys: ${Object.keys(pass3Result).join(', ')}`);
  } catch (error) {
    console.error("Pass 3 failed:", error);
    warnings.push("Draft responses and briefing generation failed.");
    pass3Result = { messages: [], draft_responses: [], flags: [], briefing: [] };
  }

  const totalTime = Date.now() - startTime;

  // ---- MERGE Pass 2 + Pass 3 messages ----
  // Claude returns Pass 3 drafts in various key names: "messages", "draft_responses", "responses"
  // Draft field can be: "draft_response", "response", "draft"
  // We handle all variants.

  const pass3Messages: Record<number, Record<string, unknown>> = {};
  const p3raw = pass3Result as Record<string, unknown>;
  const p3msgs = (
    (Array.isArray(p3raw.messages) && p3raw.messages) ||
    (Array.isArray(p3raw.draft_responses) && p3raw.draft_responses) ||
    (Array.isArray(p3raw.responses) && p3raw.responses) ||
    []
  );
  for (const m of p3msgs) {
    const msg = m as Record<string, unknown>;
    // Normalize "response" to "draft_response"
    if (msg.response && !msg.draft_response) {
      msg.draft_response = msg.response;
    }
    if (msg.draft && !msg.draft_response) {
      msg.draft_response = msg.draft;
    }
    if (msg.message_id) pass3Messages[msg.message_id as number] = msg;
  }

  // Build merged messages for all 20
  const mergedMessages: TriagedMessage[] = messages.map((original) => {
    const p2 = pass2Messages[original.id] || {};
    const p3 = pass3Messages[original.id] || {};

    return {
      message_id: original.id,
      classification: (p3.classification || p2.classification || "ignore") as TriagedMessage["classification"],
      reason: (p3.reason || p2.reason || "No classification reason available") as string,
      confidence: (p3.confidence || p2.confidence || 0.5) as number,
      related_messages: (p3.related_messages || p2.related_messages || []) as number[],
      flags: (p3.flags || p2.flags || []) as string[],
      draft_response: (p3.draft_response || "") as string,
      action_required: (p3.action_required || p2.action_required) as string | undefined,
      deadline: (p3.deadline || p2.deadline) as string | undefined,
      urgency: (p3.urgency || p2.urgency || "medium") as TriagedMessage["urgency"],
      superseded_by: (p3.superseded_by ?? p2.superseded_by ?? undefined) as number | undefined,
      delegate_to: (p3.delegate_to || p2.delegate_to) as string | undefined,
    };
  });

  // Normalize flags and briefing
  const rawFlags = pass3Result.flags || [];
  const normalizedFlags = Array.isArray(rawFlags) ? rawFlags : [];

  // Briefing can be array or object with red/amber/green keys
  const rawBriefing = (pass3Result as Record<string, unknown>).briefing || (pass3Result as Record<string, unknown>).daily_briefing || [];
  let normalizedBriefing: unknown[];
  if (Array.isArray(rawBriefing)) {
    normalizedBriefing = rawBriefing;
  } else if (typeof rawBriefing === 'object' && rawBriefing !== null) {
    // Convert object format {red: {...}, amber: {...}, green: {...}} to array
    const briefObj = rawBriefing as Record<string, unknown>;
    normalizedBriefing = [];
    for (const level of ['red', 'amber', 'green']) {
      if (briefObj[level]) {
        const section = briefObj[level] as Record<string, unknown>;
        normalizedBriefing.push({
          level,
          title: section.title || (level === 'red' ? 'Requires Immediate Decision' : level === 'amber' ? 'Needs Attention Today' : 'Handled & Delegated'),
          items: section.items || [],
        });
      }
    }
  } else {
    normalizedBriefing = [];
  }

  return {
    messages: mergedMessages,
    flags: normalizedFlags as AnalysisResult["flags"],
    briefing: normalizedBriefing as AnalysisResult["briefing"],
    metadata: {
      pass1_tokens: pass1.tokens,
      pass2_tokens: pass2Tokens,
      pass3_tokens: pass3Tokens,
      total_tokens: pass1.tokens + pass2Tokens + pass3Tokens,
      total_time_ms: totalTime,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

async function callClaude(
  client: Anthropic,
  system: string,
  userMessage: string,
  maxTokens: number
): Promise<{ text: string; tokens: number }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const tokens = response.usage.input_tokens + response.usage.output_tokens;

  try {
    const json = extractJSON(text);
    return { text: json, tokens };
  } catch {
    console.log("JSON extraction failed, retrying with explicit instruction...");
    const retryResponse = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: system + "\n\nCRITICAL: Respond with ONLY valid JSON. No markdown code fences, no explanation text. Just the raw JSON object or array.",
      messages: [{ role: "user", content: userMessage }],
    });

    const retryText =
      retryResponse.content[0].type === "text"
        ? retryResponse.content[0].text
        : "";
    const retryTokens =
      retryResponse.usage.input_tokens + retryResponse.usage.output_tokens;
    const json = extractJSON(retryText);

    return { text: json, tokens: tokens + retryTokens };
  }
}
