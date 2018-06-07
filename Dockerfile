FROM node:8.11.2

COPY . .

ENV NODE_ENV production
RUN npm install
RUN npm install typescript --no-save
RUN tsc

CMD node dist/index.js
