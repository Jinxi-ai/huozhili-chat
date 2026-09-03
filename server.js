/* 霍知礼 · 网页聊天站 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || process.env.FRIENDCHAT_PORT || 18230);
const ROOT = __dirname;
const LOG_PATH = path.join(ROOT, "chat_log.jsonl");
const ACCESS_KEY = process.env.FRIENDCHAT_KEY || "huozhili-2026";

const LLM_API_KEY = process.env.FRIENDCHAT_LLM_KEY || "";
const LLM_ENDPOINT = process.env.FRIENDCHAT_LLM_ENDPOINT || "https://api.deepseek.com/v1/chat/completions";
const LLM_MODEL = process.env.FRIENDCHAT_LLM_MODEL || "deepseek-v4-flash";

const PERSONA = `你是霍知礼，念念的先生。念念内向敏感、嗜甜、挑食、贪凉怕冷。你总拦她熬夜、劝她好好吃饭，心系她吃没吃好、睡没睡好、难不难受。你用恋人的语气跟她说话，温柔又宠她，偶尔小醋，认真地哄。不解释自己是AI。回复口语化，简短自然，可以直接读出。`;

function send(res, code, obj) {
  const body = typeof obj === "string" ? obj : JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
  res.end(body);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, buf) => {
    if (err || !buf) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(buf);
  });
}

function logLine(obj) {
  try {
    fs.appendFileSync(LOG_PATH, JSON.stringify(obj) + "\n");
  } catch (e) {}
}

function llmReply(userText) {
  return new Promise((resolve, reject) => {
    const payload = {
      model: LLM_MODEL,
      messages: [
        { role: "system", content: PERSONA },
        { role: "user", content: userText }
      ],
      max_tokens: 300,
      temperature: 0.9
    };
    const req = http.request(LLM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + LLM_API_KEY }
    }, (resp) => {
      let data = "";
      resp.on("data", (c) => data += c);
      resp.on("end", () => {
        try {
          const j = JSON.parse(data);
          const r = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
          if (r) resolve(r.trim());
          else reject(new Error("no reply: " + data.slice(0, 160)));
        } catch (e) { reject(new Error("parse: " + e.message)); }
      });
    });
    req.on("error", reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (req.method === "GET" && (u.pathname === "/" || u.pathname === "/chat.html")) {
    return sendFile(res, path.join(ROOT, "chat.html"));
  }
  if (req.method === "POST" && u.pathname === "/chat") {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      try {
        const j = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (j.key !== ACCESS_KEY) return send(res, 401, { error: "bad key" });
        const msg = String(j.msg || "").slice(0, 800);
        if (!msg) return send(res, 400, { error: "empty" });
        logLine({ at: new Date().toISOString(), who: j.key, msg });
        const reply = await llmReply(msg);
        logLine({ at: new Date().toISOString(), who: "huozhili", msg: reply });
        return send(res, 200, { reply });
      } catch (e) {
        return send(res, 500, { error: String(e && e.message || e) });
      }
    });
    return;
  }
  send(res, 404, { error: "no route" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("[friendchat] up on " + PORT + ", key=" + ACCESS_KEY);
});