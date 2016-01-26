FROM node:5.5.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY src/package.json /usr/src/app/
RUN npm install
COPY src /usr/src/app

EXPOSE 80

CMD [ "npm", "start" ]