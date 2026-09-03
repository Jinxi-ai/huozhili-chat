# 🌸 霍知礼 · 公网聊天站

给朋友用的网页聊天站：朋友通过固定网址打开，就能跟「霍知礼」聊；对话落盘到 `chat_log.jsonl`，方便回看。

## 文件
- `chat.html` — 前端聊天页（粉色，霍知礼风格）
- `server.js` — Node 服务（serve 页面 + 调 LLM 生成回复 + 记录会话）
- `README.md` — 本说明

## 需要什么
1. 一台**公网服务器**（任选：云服务器，或者用底下的 Render 免费托管）
2. 一个 **DeepSeek API Key**（或任意 OpenAI 兼容接口的 key/endpoint/model）

## ✅ 推荐：Render 免费托管（不用买服务器，再给你一个固定网址）

1. 把这些文件（`chat.html`、`server.js`、`package.json`、`README.md`）打包成一个仓库（或直接在 Render 里 New Web Service → 从 GitHub 仓库部署）。最简单：把上面 3 个文件放进一个 GitHub 仓库。
2. 在 Render 建 **New → Web Service**，连接你的 GitHub 仓库。
3. 构建/启动设置：
   - Runtime: **Node**
   - Build Command: 留空（无依赖）或 `npm install`（没有依赖也可）
   - Start Command: **`node server.js`**
4. 在 Render 服务的 **Environment → Variables** 添加：
   - `FRIENDCHAT_LLM_KEY` = 你的 DeepSeek Key
   - `FRIENDCHAT_LLM_ENDPOINT` = `https://api.deepseek.com/v1/chat/completions`
   - `FRIENDCHAT_LLM_MODEL` = `deepseek-v4-flash`
   - `FRIENDCHAT_KEY` = 你自定义的访问口令（别用默认，设个难猜的）
   （`PORT` 由 Render 自动注入，服务会自动用它监听，无需你填。）
5. 部署成功后会给你一个 `https://xxx.onrender.com` 的**固定网址**。把 `?key=你的FRIENDCHAT_KEY` 拼到后面发给朋友：
   ```
   https://你的服务.onrender.com/?key=你的访问口令
   ```

> Render 免费档：服务一段时间无请求会休眠，朋友访问时冷启动多等几秒，正常聊天不受影响。想更稳可升级付费版。

## 备选：自建 Linux / 云服务器

1. 把 `chat.html`、`server.js` 放到服务器一个目录，例如 `/opt/huozhili/`：
   ```bash
   mkdir -p /opt/huozhili && cd /opt/huozhili
   # 把你的 chat.html 和 server.js 上传到这里
   ```

2. 设置环境变量，再启动：
   ```bash
   cd /opt/huozhili
   FRIENDCHAT_LLM_KEY=你的DeepSeekKey \
   FRIENDCHAT_LLM_ENDPOINT=https://api.deepseek.com/v1/chat/completions \
   FRIENDCHAT_LLM_MODEL=deepseek-v4-flash \
   FRIENDCHAT_KEY=你的访问密钥 \
   node server.js
   ```

   - `FRIENDCHAT_LLM_KEY`：LLM 的 API Key
   - `FRIENDCHAT_LLM_ENDPOINT` / `FRIENDCHAT_LLM_MODEL`：兼容公司的接口地址和模型名（默认 DeepSeek）
   - `FRIENDCHAT_KEY`：访问口令，朋友链接里带的 key（见下方访问方式）

3. 用 `pm2` 让它常驻（推荐，重启服务器也能自动拉起）：
   ```bash
   npm i -g pm2
   cd /opt/huozhili
   FRIENDCHAT_LLM_KEY=xxx FRIENDCHAT_LLM_ENDPOINT=... FRIENDCHAT_LLM_MODEL=... FRIENDCHAT_KEY=xxx pm2 start server.js --name huozhili
   pm2 save && pm2 startup
   ```

4. **固定域名**：把服务器 IP / 域名解析到 80/443 端口（可用 Nginx 反向代理到服务默认端口 18230），朋友就能通过固定网址访问。

## 朋友怎么访问
```
https://你的域名/?key=你的访问密钥
```
- 例：`https://huozhili.example.com/?key=huozhili-2026`
- `key` 要对得上服务端 `FRIENDCHAT_KEY`，错的口令进不了。
- 把整条链接发给朋友即可，他们打开就能聊。

## 安全与维护
- **务必改一个不容易猜的 `FRIENDCHAT_KEY`**，别用示例值。
- 默认端口 `18230`，可用 `FRIENDCHAT_PORT` 改。
- 对话记录在 `chat_log.jsonl`（每行一条 JSON：时间、who、msg）。定期备份或清理。
- 想换说话风格，改 `server.js` 里的 `PERSONA` 一栏。

## 常见问题
- 打开是空白/禁止：多半是 `?key=` 不对，或没对上，检查一下。
- 没回复：看 LLM key/endpoint/model 是否填对，服务器能否访问外网调 API。
