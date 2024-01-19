FROM node:14

WORKDIR /app

COPY ./package.json package.json
COPY ./certs/cert.crt cert.crt
COPY ./certs/private.key private.key

RUN npm install /app

COPY ./src/app.js app.js

EXPOSE 80
EXPOSE 443

CMD ["npm", "start"]