# 霍知礼聊天站 · Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev || true
COPY . .
ENV PORT=18230
EXPOSE 18230
CMD ["node", "server.js"]
