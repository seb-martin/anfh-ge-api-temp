FROM elasticsearch:5.0.0

RUN mkdir -p "/usr/share/elasticsearch/backups" ; \
    chown -R elasticsearch:elasticsearch "/usr/share/elasticsearch/backups"

COPY config /usr/share/elasticsearch/config

VOLUME /usr/share/elasticsearch/backups

COPY docker-entrypoint.sh /

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["elasticsearch"]
