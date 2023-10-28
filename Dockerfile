FROM node:lts-alpine3.18

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install

COPY . .


CMD ["pnpm", "dev"]