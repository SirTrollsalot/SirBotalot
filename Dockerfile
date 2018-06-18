FROM node:8.11

COPY . .

RUN aptitude install ffmpeg && \
    npm install && \
    npm install uws hammerandchisel/erlpack sodium node-opus && \
    npm install -g typescript && \
    tsc

ENV NODE_ENV production

CMD ["/bin/node", "dist/index.js"]
