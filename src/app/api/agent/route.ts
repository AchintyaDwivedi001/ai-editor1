
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), { status: 400 });
    }

    // ✅ Initialize Groq client once
    const client = new Groq({ apiKey: GROQ_KEY });

    // ✅ Use a valid Groq model
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // fast + free model
      messages: [
        { role: "system", content: "You are a helpful summarizer." },
        { role: "user", content: `Summarize this: ${query}` },
      ],
    });

    const summary = completion.choices[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ summary }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Agent error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
