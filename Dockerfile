FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm ci 

COPY * .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json .

ENV NODE_ENV=production

RUN npm ci

COPY --from=build /app/js-build .

CMD [ "node", "index.js" ]