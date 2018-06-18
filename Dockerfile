FROM node:8.11

ENV APP_DIR /app
ENV PATH "$PATH:${APP_DIR}/node_modules/ffmpeg-binaries/bin"

WORKDIR ${APP_DIR}
COPY . .

RUN npm install
RUN npm install uws hammerandchisel/erlpack libsodium-wrappers node-opus ffmpeg-binaries
RUN npm install -g typescript
RUN tsc

ENV NODE_ENV production

CMD ["node", "dist/index.js"]
