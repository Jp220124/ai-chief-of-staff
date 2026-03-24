import Anthropic from "@anthropic-ai/sdk";
import { Message, AnalysisResult } from "./types";
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
  let pass2Result;
  let pass2Tokens = 0;
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
  } catch (error) {
    console.error("Pass 2 failed, using Pass 1 results:", error);
    warnings.push("Cross-referencing unavailable — showing initial classifications only.");
    pass2Result = { messages: pass1Result, detected_patterns: [] };
  }

  // ---- PASS 3: Generate Outputs ----
  let pass3Result;
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

    console.log(`Pass 3 complete: ${pass3Tokens} tokens`);
  } catch (error) {
    console.error("Pass 3 failed, using Pass 2 results:", error);
    console.error("Pass 3 error details:", error instanceof Error ? error.message : String(error));
    warnings.push("Draft responses and briefing generation failed — showing classifications and flags only.");
    pass3Result = {
      messages: pass2Result.messages || pass1Result,
      flags: [],
      briefing: [],
    };
  }

  const totalTime = Date.now() - startTime;

  // Normalize the response — Claude may return different formats
  const rawMessages = pass3Result.messages || pass2Result.messages || pass1Result;
  const normalizedMessages = Array.isArray(rawMessages) ? rawMessages : [];

  const rawFlags = pass3Result.flags || [];
  const normalizedFlags = Array.isArray(rawFlags) ? rawFlags : [];

  const rawBriefing = pass3Result.briefing || [];
  const normalizedBriefing = Array.isArray(rawBriefing) ? rawBriefing : [];

  return {
    messages: normalizedMessages,
    flags: normalizedFlags,
    briefing: normalizedBriefing,
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
    // Retry once with explicit JSON-only instruction
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
