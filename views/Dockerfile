FROM node:6.2.2

RUN mkdir -p /usr/src
WORKDIR /usr/src

COPY src/package.json /usr/src
RUN npm install

COPY src/server.js /usr/src/
COPY src/templ /usr/src/templ/

EXPOSE 8082

CMD [ "npm", "start" ]
