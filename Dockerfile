FROM node:8.11.2

COPY dist/**.js .

ENV NODE_ENV production
RUN npm install

CMD node index.js
