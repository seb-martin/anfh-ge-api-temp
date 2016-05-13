var gulp = require('gulp');
var elasticsearch = require('elasticsearch');

var dbHost        = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
var dbPort        = process.env.DB_PORT_9200_TCP_PORT || 9200

var client        = new elasticsearch.Client({
  host: 'host:port'.replace('host', dbHost).replace('port', dbPort)
  // , log: 'trace'
});

var scroll = '30s';
var size = 5;
var alias = 'par';

/*
Commandes ElasticSearch
*/

var createIndex = function(index, mapping) {
  return client.indices.create({
    index: index,
    body: mapping
  });
};

var deleteIndex = function(index) {
  return client.indices.delete({index: index});
};

var createAlias = function(index) {
  return client.indices.putAlias({ index: index, name: alias });
};

var deleteAlias = function(index) {
  return client.indices.deleteAlias({index: index, name: alias});
};

var search = function(index, type) {
  return client.search({ index: index, type: type, scroll: scroll, size: size });
};

var searchScroll = function(scrollId) {
  return client.scroll({ scrollId: scrollId, scroll: scroll, size: size });
}

var bulk = function(index, bulkArr) {
  return client.bulk({ index: index, body: bulkArr });
};

/*
Fonctions de migration
*/

var buildBulkArr = function(indexTarget, searchResult, transformFn) {
  var bulkArr = [];

  searchResult.hits.hits.forEach(function (hit) {
    bulkArr.push({"index":{"_index":indexTarget, "_type":hit._type, "_id":hit._id}});

    bulkArr.push(typeof transformFn === 'function' ? transformFn(hit._source) : hit._source);
  });

  return bulkArr;
};

var searchNbulk = function(prevIndex, nextIndex, type, transformFn) {
  return search(prevIndex, type).then(function(response) {
    if (response.hits.hits.length > 0) {
      var bulkArr = buildBulkArr(nextIndex, response, transformFn);
      // TODO bulk(nextIndex, bulkArr);
      console.dir(bulkArr);

      return scrollNbulk(response._scroll_id, nextIndex, transformFn);
    }
  });
};

var scrollNbulk = function(scrollId, nextIndex, transformFn) {
  return searchScroll(scrollId).then(function(response) {
    if (response.hits.hits.length > 0) {
      var bulkArr = buildBulkArr(nextIndex, response);
      // TODO bulk(nextIndex, bulkArr);
      console.dir(bulkArr);

      return scrollNbulk(response._scroll_id, nextIndex, transformFn);
    }
  });
};

/*
Tâches du mapping 1_0
*/

gulp.task('create_1_0', function(cb) {
  var index = 'par_1_0';
  var mapping = require('./mappings/par_1_0');
  createIndex(index, mapping).then(function() {
    cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
});

gulp.task('delete_1_0', function(cb) {
  var index = 'par_1_0';
  deleteIndex(index).then(function() {
    cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
});

/*
Tâches du mapping 1_1
*/

gulp.task('create_1_1', function(cb) {
  var index = 'par_1_1';
  var mapping = require('./mappings/par_1_1');
  createIndex(index, mapping).then(function() {
    cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
});

gulp.task('migrate_1_0_to_1_1', function(cb) {
  var prevIndex = 'par_1_0';
  var nextIndex = 'par_1_1';

  searchNbulk(prevIndex, nextIndex, 'regions').then(function() {
    return searchNbulk(prevIndex, nextIndex, 'axes')
  }).then(function() {
    return searchNbulk(prevIndex, nextIndex, 'actions')
  }).then(function() {
    cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });

});

gulp.task('alias_1_0_to_1_1', function(cb) {
  deleteAlias('par_0_1').then(function() {
    return createAlias('par_1_1');
  }).then(function() {
    cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
});

gulp.task('delete_1_1', function(cb) {
  var index = 'par_1_1';
  deleteIndex(index).then(function() {
    cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
});

/*
Tâches de reprise de données
*/

gulp.task('recover_regions', function(cb) {
});

gulp.task('recovery', ['recover_regions', 'recover_actions_before_2014', 'recover_actions_starting_2014'], function(cb) {
  console.info('recovery done');
});

/*
Tâches de migration d'un index source vers un index cible
*/

gulp.task('from_1_0_to_1_1', ['create_1_1', 'migrate_1_0_to_1_1', 'alias_1_0_to_1_1', 'delete_1_0'], function(cb){
  console.info('from_1_0_to_1_1 done');
});



gulp.task('hello', function(cb){

  client.ping({
    requestTimeout: 30000,

    // undocumented params are appended to the query string
    hello: "elasticsearch"
  }).then(function(body) {
    console.log('All is well');
    cb();
  }).catch(function(err) {
    console.error('elasticsearch cluster is down!');
    cb(err);
  });

});


gulp.task('default', function(){
  console.dir(process.env);
});
