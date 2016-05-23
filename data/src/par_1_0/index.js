
var through = require('through2');
var stream = require('stream');
var gulp = require('gulp');

var INDEX_1_0 = 'par_1_0';


var actionsBefore2014 = function() {
  return require('./actions/recovery-before-2014')(INDEX_1_0);
};

var actionsStarting2014 = function() {
  return require('./actions/recovery-starting-2014')(INDEX_1_0);
};

module.exports = function(esHelpers) {

  var regionsStream = function() {
    var readable = stream.Readable({objectMode: true});

    readable._regions = require('./regions/regions');

    readable._read = function(sizeIsIgnored) {
      while ( this._regions.length ) {
        var region = this._regions.shift();
        region._index = INDEX_1_0;
        region._type = 'regions';
        region._id = region.code;
        var more = this.push(region);
        this.emit('region', region);
        // if (!more) {
        //     break;
        // }
      }

      if ( ! this._regions.length ) {
        this.push(null);
      }
    };

    return readable;
  };

  var regionsBulk = function() {
    return esHelpers.bulker();
  };

  var actionsBulk = function() {
    return esHelpers.bulker({
      action: function(action) {
        var _id = action._id;
        delete action._id;

        return {'index': {'_index': INDEX_1_0, '_type': 'actions', '_id': _id}};
      }
    });
  };


  return {
    deleteIndex: function() {
      return esHelpers.deleteIndex({index: INDEX_1_0, ignore: 404})
        .then(function(response) {
          // Si la réponse contient une erreur (404), on la notifie
          var alerte = response.error ? '(L\'index n\'existait pas)' : '';

          console.info('Succès de suppresssion de l\'index', INDEX_1_0, alerte);
        }).catch(function(err) {
          console.error('Echec de suppresssion de l\'index', INDEX_1_0, JSON.stringify(err));
        });
    },

    createIndex: function() {
      var mapping = require('./par_1_0.json');
      return esHelpers.createIndex({
        index: INDEX_1_0,
        body: mapping
      }).then(function(response) {
        console.info('Succès de création de l\'index', INDEX_1_0);
      }).catch(function(err) {
        console.error('Echec de création de l\'index', INDEX_1_0, JSON.stringify(mapping), err);
      });
    },

    recoverRegions: function() {
      return regionsStream()
        .pipe(regionsBulk())
        .on('end', function() {
          console.info('Succès de reprise des régions sur l\'index', INDEX_1_0);
        })
        .on('error', function(err) {
          console.error('Echec de reprise des régions sur l\'index', INDEX_1_0, err);
        });

    },

    recoverActionsBefore2014: function() {
      return gulp.src('par_1_0/actions/offres_formations_avant_2014.xml')
        .pipe(actionsBefore2014(INDEX_1_0))
        .pipe(actionsBulk())
        .on('end', function() {
          console.info('Succès de reprise des actions < 2014 sur l\'index', INDEX_1_0);
        })
        .on('error', function(err) {
          console.error('Echec de reprise des actions < 2014 sur l\'index', INDEX_1_0, err);
        });

    },

    recoverActionsStarting2014: function() {
      return gulp.src('par_1_0/actions/offres_formations_apartirde_2014.xml')
        .pipe(actionsStarting2014(INDEX_1_0))
        .pipe(actionsBulk())
        .on('end', function() {
          console.info('Succès de reprise des actions >= 2014 sur l\'index', INDEX_1_0);
        })
        .on('error', function(err) {
          console.error('Echec de reprise des actions >= 2014 sur l\'index', INDEX_1_0, err);
        });
    },

    scrollRegions: function() {
      return esHelpers.scroller({
        index: INDEX_1_0,
        type: 'regions',
        scroll: '5s',
        size: 5
      });
    },

    scrollAxes: function() {
      return esHelpers.scroller({
        index: INDEX_1_0,
        type: 'axes',
        scroll: '5s',
        size: 5
      });
    },

    scrollActions: function() {
      return esHelpers.scroller({
        index: INDEX_1_0,
        type: 'actions',
        scroll: '5s',
        size: 5
      });
    },

    createAlias: function(alias) {
      return esHelpers.createAlias({index: INDEX_1_0, name: alias})
        .then(function(response) {
          console.info('Succès de création de l\'alias', alias, 'vers l\'index', INDEX_1_0);
        }).catch(function(err) {
          console.error('Echec de création de l\'alias', alias, 'vers l\'index', INDEX_1_0, JSON.stringify(mapping), err);
        });
    },

    deleteAlias: function(alias) {
      return esHelpers.deleteAlias({index: INDEX_1_0, name: alias})
        .then(function(response) {
          console.info('Succès de suppression de l\'alias', alias, 'vers l\'index', INDEX_1_0);
        }).catch(function(err) {
          console.error('Echec de suppression de l\'alias', alias, 'vers l\'index', INDEX_1_0, JSON.stringify(mapping), err);
        });
    }

  };

};
