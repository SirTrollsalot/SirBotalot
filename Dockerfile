FROM node:8.11

ENV APP_DIR /app

WORKDIR ${APP_DIR}
COPY . .

RUN npm install
RUN npm install uws hammerandchisel/erlpack libsodium-wrappers node-opus ffmpeg-binaries
RUN npm install -g typescript
RUN tsc
RUN ln -s node_modules/ffmpeg-binaries/bin/ffmpeg /bin/ffmpeg

ENV NODE_ENV production

CMD ["/bin/node", "./dist/index.js"]
