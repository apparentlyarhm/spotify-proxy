# ===== Stage 1: Build =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# ===== Stage 2: Runtime =====
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "app.js"]