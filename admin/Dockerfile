FROM node:7.1.0

RUN npm install -g gulp

RUN mkdir -p /usr/src
WORKDIR /usr/src

COPY src/package.json .
RUN npm install

COPY src/gulpfile.js .

ENTRYPOINT ["gulp"]
CMD ["default"]
