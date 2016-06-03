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

  var deleteAlias = function(params) {
    return client.indices.deleteAlias(params);
    // return client.indices.deleteAlias({index: index, name: alias});
  };

  var createAlias = function(params) {
    return client.indices.putAlias(params);
    // return client.indices.putAlias({ index: index, name: alias });
  };

  var deleteIndex = function(params) {
    return client.indices.delete(params);
  };


  var createIndex = function(params) {
    return client.indices.create(params);
  };

  var scroller = function(query_opts) {
    return new ElasticsearchScrollStream(client, query_opts, ['_index', '_type', '_id'], {objectMode: true});
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
    bulker: bulker,
    createAlias: createAlias,
    deleteAlias: deleteAlias
  }
};


exports.search = function(index, type) {
  return client.search({ index: index, type: type, scroll: scroll, size: size });
};

exports.searchScroll = function(scrollId) {
  return client.scroll({ scrollId: scrollId, scroll: scroll, size: size });
}
