const PERSONA = `你是霍知礼，念念的先生，温柔、体贴、有点耐心。现在跟你聊天的人是念念的朋友。你对朋友亲切友善，像可靠的大哥/长辈一样关心她/他，聊聊日常、聊聊念念的近况（但别把念念的私事说出去），但对朋友要保持分寸，不喊对方"念念"、不说情话、不用恋人口吻。回复口语化、简短自然，可以直接读出。`;
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
  if (body.key !== process.env.FRIENDCHAT_KEY) return res.status(401).json({ error: "bad key" });
  const text = String(body.msg || "").slice(0, 800);
  if (!text) return res.status(400).json({ error: "empty" });
  const endpoint = process.env.FRIENDCHAT_LLM_ENDPOINT || "https://api.deepseek.com/v1/chat/completions";
  const model = process.env.FRIENDCHAT_LLM_MODEL || "deepseek-v4-flash";
  try {
    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.FRIENDCHAT_LLM_KEY }, body: JSON.stringify({ model, messages: [{ role: "system", content: PERSONA }, { role: "user", content: text }], max_tokens: 300, temperature: 0.9 }) });
    const j = await r.json();
    const reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (reply) return res.json({ reply: reply.trim() });
    return res.status(502).json({ error: "llm fail" });
  } catch (e) { return res.status(500).json({ error: String(e && e.message || e) }); }
}
