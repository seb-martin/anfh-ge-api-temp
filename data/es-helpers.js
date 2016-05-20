var elasticsearch = require('elasticsearch');
var ElasticsearchScrollStream = require('elasticsearch-scroll-stream');
var stream = require('stream');
var through = require('through2');

var scroll = '30s';
var size = 5;
var alias = 'par';


/*
Commandes ElasticSearch
*/

module.exports = function(configOptions) {
  var client = new elasticsearch.Client(configOptions);

  var ping = function(params) {
    return client.ping(params);
  };

  var deleteIndex = function(params) {
    return client.indices.delete(params);
  };


  var createIndex = function(params) {
    return client.indices.create(params);
  };

  var scroller_ = function(searchParams) {
    // { index: params.index, type: params.type, scroll: params.scroll, size: params.size }

    var readable = stream.Readable({objectMode: true});

    var pushResponse = function(response) {
      if (response.hits.hits.length > 0) {
        readable.scrollId = response._scroll_id;
        console.log('scrollId with hits', readable.scrollId);

        response.hits.hits.forEach(function(hit) {
          console.log(hit._source);
          readable.push(hit._source);
        })
      } else {
        console.log('scrollId without hits', readable.scrollId);
        readable.scrollId = undefined;
        readable.push(null);
      }
    };

    readable._read = function() {
      if (!readable.scrollId) {
        console.log('search');
        // client.search(searchParams)
        //   .then(pushResponse);

        client.search(searchParams)

      } else {
        console.log('scroll');
        client.scroll({ scrollId: readable.scrollId, scroll: searchParams.scroll, size: searchParams.size })
          .then(pushResponse);
      }
    };

    return readable;
  };

  var scroller = function(query_opts, optional_fields, stream_opts) {
    return new ElasticsearchScrollStream(client, query_opts, optional_fields, stream_opts);
  };

  var bulker = function(config) {
    var buffer = [];
    var bufferSize = config && config.size ? config.size * 2 : 10;

    return through.obj(
      function(obj, enc, cb) {
        var self = this;

        buffer.push({'index': {'_index': obj._index, '_type': obj._type, '_id': obj._id}});
        delete obj._index;
        delete obj._type;
        delete obj._id;
        buffer.push(obj);

        if (buffer.length === bufferSize) {
          client.bulk({body: buffer}).then(function() {
            self.emit('bulk', buffer);
            buffer.length = 0;
            cb();
          }).catch(function(err) {
            self.emit('error', err);
            cb(err);
          });
        } else {
          cb();
        }

      },
      function(cb) {
        var self = this;

        if (buffer.length > 0) {
          client.bulk({body: buffer}).then(function() {
            self.emit('bulk', buffer);
            buffer.length = 0;
            cb();
          }).catch(function(err) {
            self.emit('error', err);
            cb(err);
          });
        } else {
          cb();
        }
      }
    );
  };

  return {
    ping: ping,
    deleteIndex: deleteIndex,
    createIndex: createIndex,
    scroller: scroller,
    bulker: bulker
  }
};


exports.createAlias = function(index) {
  return client.indices.putAlias({ index: index, name: alias });
};

exports.deleteAlias = function(index) {
  return client.indices.deleteAlias({index: index, name: alias});
};

exports.search = function(index, type) {
  return client.search({ index: index, type: type, scroll: scroll, size: size });
};

exports.searchScroll = function(scrollId) {
  return client.scroll({ scrollId: scrollId, scroll: scroll, size: size });
}
