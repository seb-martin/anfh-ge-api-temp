FROM node:6.2.2

RUN mkdir -p /usr/src
WORKDIR /usr/src

COPY package.json /usr/src
RUN npm install

COPY server.js templ /usr/src

EXPOSE 80

CMD [ "npm", "start" ]
