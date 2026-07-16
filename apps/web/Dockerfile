FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache curl wget
RUN corepack enable

COPY package.json ./
RUN pnpm install

COPY . .
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
