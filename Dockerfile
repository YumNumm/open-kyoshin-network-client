FROM node:lts-alpine3.18 as deps

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install

COPY . .

RUN pnpm build

CMD ["pnpm", "start"]