FROM node:20-alpine

WORKDIR /app

# ✅ REQUIRED for Coolify healthcheck (wget is mandatory)
RUN apk add --no-cache curl wget

RUN corepack enable

COPY package.json ./
RUN pnpm install

COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
