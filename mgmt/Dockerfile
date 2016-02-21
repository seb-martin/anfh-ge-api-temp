FROM kibana:4.4.1

# Réalise l'installation de Sense en tant que user kibana
# cf. https://github.com/docker-library/kibana/issues/20
RUN gosu kibana kibana plugin --install elastic/sense
