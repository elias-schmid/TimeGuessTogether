FROM node:latest

WORKDIR /app

COPY ./package.json package.json

RUN npm install /app

COPY ./src/app.js app.js

CMD ["npm", "start"]