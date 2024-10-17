FROM node:20 AS build

WORKDIR /app

COPY package*.json .

RUN npm i

COPY * .

RUN npm run build

FROM node:20

WORKDIR /app

COPY package*.json .

ENV NODE_ENV=production

RUN npm ci

COPY --from=build /app/js-build .

CMD [ "node", "index.js" ]