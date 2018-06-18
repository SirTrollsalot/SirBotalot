FROM node:8.11.2

COPY . .

RUN npm install && \
    npm install uws hammerandchisel/erlpack sodium node-opus ffmpeg-binaries && \
    npm install -g typescript && \
    tsc

ENV PATH="${PATH}:node_modules/ffmpeg-binaries/bin"
ENV NODE_ENV production

CMD ["/bin/node", "dist/index.js"]
