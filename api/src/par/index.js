var Promise = require('promise');
var par = require('./domain');
var typologies = require('./typologies');

par.regions.mapHitToResource = function(req, hit) {
  return Promise.resolve(hit._source);
};

par.axes.mapHitToResource = function(req, hit) {
  var axe = hit._source;
  axe.id = hit._id;
  return Promise.resolve(axe);
};

par.actions.mapHitToResource = function(req, hit) {
  var action = hit._source;

  // Ajoute l'id de l'action
  action.id = hit._id;

  // Retire la propriété _publie
  delete action._publie;

  // Remplace le code de typologigie par la typologie FPTLV
  if (action.typologie) {
    action.typologie = typologies[action.typologie];
  }

  // Remplace l'id d'axe par l'axe de formation
  var p;
  if (action.axe) {
    p = req.esClient.get({
      index: 'par',
      type: 'axes',
      id: action.axe
    })
    .then(function(axeHit) {
      return par.axes.mapHitToResource(req, axeHit).then(function(axe) {
        action.axe = axe;

        delete action.axe.region;
        delete action.axe.exercice;
        delete action.axe.derniereModif;

        return Promise.resolve(action);
      });

    }).catch(function(error) {
      console.warn(error);
      delete action.axe;
      return Promise.resolve(action);
    });

  } else {
    p = Promise.resolve(action);
  }

  return p;

};

module.exports = par;
