/**
 * Robust JSON extraction from Claude's response text.
 * Handles: code fences, raw JSON, prose wrapping.
 */
export function extractJSON(text: string): string {
  // Strategy 1: Find ```json ... ``` code fence
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const candidate = fenceMatch[1].trim();
    if (isValidJSON(candidate)) return candidate;
  }

  // Strategy 2: Find outermost { ... } (object)
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    const candidate = text.slice(objStart, objEnd + 1);
    if (isValidJSON(candidate)) return candidate;
  }

  // Strategy 3: Find outermost [ ... ] (array)
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) {
    const candidate = text.slice(arrStart, arrEnd + 1);
    if (isValidJSON(candidate)) return candidate;
  }

  throw new Error(
    `Failed to extract JSON from response. Raw text (first 500 chars): ${text.slice(0, 500)}`
  );
}

function isValidJSON(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
