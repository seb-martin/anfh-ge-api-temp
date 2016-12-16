var moment = require('moment');

var INDEX_1_1 = 'par_1_1';

module.exports = function(esHelpers) {

  return {
    indexSiege: function() {
      var siege = {
        index: INDEX_1_1,
        type: 'regions',
        id: 'NAT',
        body: {
          'code': 'NAT',
          'denomination': 'Siège',
          'derniereModif': moment().toISOString()
        }
      };

      esHelpers.index(siege);
    }
  }
};
