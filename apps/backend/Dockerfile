FROM node:22-alpine

WORKDIR /app

# Required by Coolify health checks
RUN apk add --no-cache curl wget

RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "src/index.js"]