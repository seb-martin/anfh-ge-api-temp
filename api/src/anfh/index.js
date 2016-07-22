var anfh = require('./domain');

anfh.centresbc.mapHitToResource = function(req, hit) {
  return hit._source;
};

module.exports = anfh;
