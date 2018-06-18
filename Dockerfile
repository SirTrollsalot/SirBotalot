FROM node:8.11

ENV APP_DIR /app

WORKDIR ${APP_DIR}
COPY . .

RUN npm install
RUN npm install uws hammerandchisel/erlpack libsodium-wrappers node-opus
RUN npm install -g typescript
RUN tsc

ENV NODE_ENV production
ENV PATH "$APP_DIR/node_modules/ffmpeg-binaries/bin"

CMD ["/bin/node", "./dist/index.js"]
