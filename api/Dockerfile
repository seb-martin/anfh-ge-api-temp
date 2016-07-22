FROM node:6.2.2

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY src/package.json /usr/src/app/
RUN npm install

COPY src/server.js /usr/src/app
COPY src/anfh /usr/src/app/anfh
COPY src/par /usr/src/app/par
COPY src/root /usr/src/app/root

EXPOSE 8081

CMD [ "npm", "start" ]
