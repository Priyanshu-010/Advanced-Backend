FROM node

WORKDIR /app

COPY index.js index.js
COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

CMD [ "node" , "index.js" ]