FROM node:8.11

ENV APP_DIR /app

WORKDIR ${APP_DIR}
COPY . .

RUN npm install && \
    npm install uws hammerandchisel/erlpack sodium node-opus && \
    npm install -g typescript && \
    tsc

ENV NODE_ENV production
ENV PATH "$PATH:$APP_DIR/node_modules/ffmpeg-binaries/bin"

CMD ["/bin/node", "./dist/index.js"]
