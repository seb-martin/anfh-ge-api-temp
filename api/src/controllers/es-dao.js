var Promise = require('promise');

var hitsToCollection = function(dao, hits, hitToObjCb) {
  var self = this;
  return Promise.all(hits.hits.map(function(hit) {
    return hit ? hitToObjCb(dao, hit) : hit;
  })).then(function(items) {
    return {
      total: hits.total,
      items: items
    };
  });

};

class DAO {
  constructor(esClient) {
    this._esClient = esClient;
  }

  get(getParams, hitToObjCb) {
    var self = this;
    return this._esClient.get(getParams).then(function(hit) {
      return hitToObjCb(self, hit);
    });
  }

  search(searchParams, hitToObjCb) {
    var self = this;
    return this._esClient.search(searchParams).then(function(searchResult) {
      return hitsToCollection(self, searchResult.hits, hitToObjCb);
    });
  }


}

module.exports = DAO;
