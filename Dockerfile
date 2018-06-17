FROM node:8.11.2

COPY . .

RUN npm install && \
    npm install uws hammerandchisel/erlpack sodium node-opus && \
    npm install -g typescript && \
    tsc

ENV NODE_ENV production

CMD node dist/index.js
