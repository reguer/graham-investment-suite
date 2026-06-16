export async function generateAnalysis(prompt) {
  if (typeof window !== "undefined" && window.claude?.complete) {
    return window.claude.complete(prompt);
  }

  const apiKey = import.meta.env?.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("No hay API de Anthropic disponible. Define VITE_ANTHROPIC_API_KEY o ejecuta el artifact en un entorno compatible.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Anthropic devolvió ${response.status}: ${details || response.statusText}`);
  }

  const data = await response.json();
  const text = data.content?.map((block) => block.text).filter(Boolean).join("\n");
  if (!text) throw new Error("Anthropic no devolvió texto de análisis.");
  return text;
}
