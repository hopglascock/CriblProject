FROM node:22 as base

WORKDIR /home/node/app
copy package*.json ./


RUN npm i

COPY . .

FROM base as production

ENV NODE_ENV=production

RUN npm run build