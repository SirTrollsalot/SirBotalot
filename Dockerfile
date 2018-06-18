FROM node:8.11

COPY . .

RUN apt-get update && \
    apt-get -y install libav-tools && \
    npm install && \
    npm install uws hammerandchisel/erlpack sodium node-opus && \
    npm install -g typescript && \
    tsc

ENV NODE_ENV production

CMD ["/bin/node", "dist/index.js"]
