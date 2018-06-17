FROM node:8.11.2

COPY . .

ENV NODE_ENV production
RUN npm install
RUN npm install uws hammerandchisel/erlpack sodium node-opus
RUN npm install typescript --no-save
RUN ./node_modules/.bin/tsc

CMD node dist/index.js
