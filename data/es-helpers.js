var elasticsearch = require('elasticsearch');
var stream = require('stream');
var through = require('through2');

var dbHost        = process.env.DB_PORT_9300_TCP_ADDR || 'localhost1';
var dbPort        = process.env.DB_PORT_9200_TCP_PORT || 9200

var client        = new elasticsearch.Client({
  host: 'host:port'.replace('host', dbHost).replace('port', dbPort)
  // , log: 'trace'
});

var scrollId;
var scroll = '30s';
var size = 5;
var alias = 'par';

var buildBulkArr = function(indexTarget, searchResult, transformFn) {
  var bulkArr = [];

  searchResult.hits.hits.forEach(function (hit) {
    bulkArr.push({'index': {'_index': indexTarget, '_type': hit._type, '_id': hit._id}});

    bulkArr.push(typeof transformFn === 'function' ? transformFn(hit._source) : hit._source);
  });

  return bulkArr;
};

/*
Commandes ElasticSearch
*/

exports.ping = function(params) {

  var called = false;
  var readable = stream.Readable({objectMode: true});

  readable._read = function() {
    var self = this;
    if(called) {
      self.push(null);
    } else {
      called = true;
      client.ping(params).then(function(body) {
        var pong = {hello: body};
        self.push(pong);
        self.emit('pong', pong);
      }).catch(function(err) {
        self.emit('error', new Error(err.message));
      });
    }
  }

  return readable;

  // return client.ping({
  //   requestTimeout: 30000,
  //
  //   // undocumented params are appended to the query string
  //   hello: "elasticsearch"
  // }).then(function(body) {
  //   console.info('Succès de connexion ElasticSearch');
  // }).catch(function(err) {
  //   console.error('Echec de connexion ElasticSearch');
  // });

};

exports.createMapping = function(index) {
  return through.obj(function(mappingFile, enc, cb) {

    var mapping = JSON.parse(mappingFile.contents);

    return client.indices.create({
      index: index,
      body: mapping
    }).then(function() {
      console.info('Succès de création de l\'index', index);
      cb();
    }).catch(function(err) {
      console.error('Echec de création de l\'index', index);
      cb(err);
    });
  });
};

exports.createIndex = function(index) {
  var mapping = require('./' + index + '/' + index);
  return client.indices.create({
    index: index,
    body: mapping
  }).then(function() {
    console.info('Succès de création de l\'index %i'.replace('%i', index));
  }).catch(function(err) {
    console.error('Echec de création de l\'index %i'.replace('%i', index), err.message);
  });


};

exports.deleteMapping = function(index) {

  var readable = stream.Readable();

  readable._read = function() {
    client.indices.delete({index: index, ignore: 404}).then(function(response) {
      var car = response.error ? '(l\'index n\'existait pas)' : '';
      console.info('Succès de suppresssion de l\'index %i'.replace('%i', index), car);
      readable.push(null);
    }).catch(function(err) {
      console.error('Echec de suppresssion de l\'index %i'.replace('%i', index));
    });
  };

  return readable;


};

exports.deleteIndex = function(index) {
  return client.indices.delete({index: index, ignore: 404}).then(function(response) {
    var car = response.error ? '(l\'index n\'existait pas)' : '';
    console.info('Succès de suppresssion de l\'index %i'.replace('%i', index), car);
  }).catch(function(err) {
    console.error('Echec de suppresssion de l\'index %i'.replace('%i', index));
  });

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

exports.bulk = function() {
  return through.obj(function(bulkArr, enc, cb) {

    client.bulk({ body: bulkArr }).then(function() {
      console.log('bulked !', bulkArr);
      cb();
    }).catch(function(err) {
      console.error('Echec du bulk : ', err.message);
      cb(err);
    });

  }, function(cb) {
    console.info('Succès du bulk');
    cb();
  });
};

exports.scroller = function(index, type) {
  var readable = stream.Readable({objectMode: true});

  var pushResponse = function(response) {
    if (response.hits.hits.length > 0) {
      scrollId = response._scroll_id;
      readable.push(response);
    } else {
      scrollId = undefined;
      readable.push(null);
    }
  };

  readable._read = function() {
    if (!scrollId) {
      client.search({ index: index, type: type, scroll: scroll, size: size })
        .then(pushResponse);
    } else {
      client.scroll({ scrollId: scrollId, scroll: scroll, size: size })
        .then(pushResponse);
    }
  };

  return readable;

}

/*
Récupère les _source d'une réponse de recherche
*/
exports.sources = function() {
  return through.obj(function(response, enc, cb) {
    this.push(response.hits.hits.map(function(hit) {
      return hit._source;
    }));
    cb();
  });
};
