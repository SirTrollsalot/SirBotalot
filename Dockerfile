FROM node:8-alpine

COPY . .

RUN apk add --update git && \
    apk add ffmpeg && \
    npm install && \
    npm install uws hammerandchisel/erlpack sodium node-opus && \
    npm install -g typescript && \
    tsc

ENV NODE_ENV production

CMD ["/bin/node", "dist/index.js"]
