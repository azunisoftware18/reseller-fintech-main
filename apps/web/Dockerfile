FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl wget
RUN corepack enable
RUN corepack prepare pnpm@10.17.1 --activate

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]