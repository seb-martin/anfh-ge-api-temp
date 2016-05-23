FROM node:6

RUN npm install --global gulp-cli

RUN mkdir -p /usr/src
WORKDIR /usr/src

COPY src .
RUN npm install

ENTRYPOINT ["gulp"]
CMD ["default"]
