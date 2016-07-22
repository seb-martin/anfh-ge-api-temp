FROM node:5.5.0

# Installe Bower, Gulp et Http-Server
################################

RUN npm install -g bower gulp

RUN mkdir -p /usr/src
WORKDIR /usr/src

# Installe les packages Node JS
################################

COPY package.json /usr/src/
RUN npm install

# Installe les dépendances Bower
################################
# Remarques :
# - Par défaut, Bower n'accèpte pas d'être exécuté en tant que `root`.
#   Le fichier .bowerrc contient la configuration permettant de contourner le problème.
# - A l'ANFH, les outils de sécurité n'accèpte pas le protocole git://
#   La configuration de Git est ajustée pour utiliser le protocole https://au lieu de git://
#   cf. https://github.com/seb-martin/anfh-ge-api-temp/issues/1

COPY bower.json .bowerrc /usr/src/
RUN git config --global url."https://".insteadOf git:// \
		&& bower install

# Construit le projet avec Gulp
################################

COPY gulpfile.js .jscsrc .jshintrc /usr/src/
COPY app /usr/src/app
RUN gulp

EXPOSE 8080

COPY server.js /usr/src

CMD [ "node", "server.js" ]
