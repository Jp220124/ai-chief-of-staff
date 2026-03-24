import { NextResponse } from "next/server";
import { analyzeMessages } from "@/lib/analyze";
import defaultMessages from "@/data/messages.json";
import { Message } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    let messages: Message[];

    // Accept custom messages in request body (for upload feature)
    const body = await request.json().catch(() => null);
    if (body?.messages && Array.isArray(body.messages)) {
      messages = body.messages;
    } else {
      messages = defaultMessages as Message[];
    }

    const result = await analyzeMessages(messages);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    console.error("Analysis error:", error);

    if (message.includes("rate_limit") || message.includes("429")) {
      return NextResponse.json(
        { error: "API rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
