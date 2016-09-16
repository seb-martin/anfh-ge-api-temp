(function() {
  'use strict';

  var express = require('express');
  var fs = require('fs');
  var pug = require('pug');
  var marked = require('marked');
  var moment = require('moment');
  var humanizeDuration = require('humanize-duration');

  // Dictionnaire des typologies FPTLV
  var typologies = require('./typologies');

  // Dictionnaire des intitulés de nature
  var natures = require('./natures');

  moment.locale('fr');

  var app = express();

  var catchError = function(res, error){
    console.trace(error.message);
    res.status(error.status).json({
      status: error.status,
      message: error.message
    });
  };

  var getActionHit = function(req, res, next) {
    req.esClient.get({
      index: 'par',
      type: 'actions',
      id: req.params.id
    }).then(function(hit) {
      req.actionHit = hit;
      next();
    }).catch(function(error){
      catchError(res, error);
    });
  };

  var getAxeHit = function(req, res, next) {
    if (req.actionHit._source.axe) {
      req.esClient.get({
        index: 'par',
        type: 'axes',
        id: req.actionHit._source.axe
      }).then(function(hit) {
        req.axeHit = hit;
        next();
      }).catch(function(error){
        catchError(res, error);
      });
    } else {
      req.axeHit = null;
      next();
    }
  };

  var mapHitToAction = function(req, res, next) {
    var action = req.actionHit._source;

    // Ajoute l'id de l'action
    action.id = req.actionHit._id;

    // Remplace le code de nature par son intitulé
    if (action.nature) {
      action.nature = natures[action.nature];
    }

    // Remplace le code de typologigie par la typologie FPTLV
    if (action.typologie) {
      action.typologie = typologies[action.typologie];
    }

    // Remplace le texte en markdown par sa version en html
    action.contexte = action.contexte ? marked(action.contexte) : '';
    action.objectifs = action.objectifs ? marked(action.objectifs) : '';
    action.autre = action.autre ? marked(action.autre) : '';

    if (action.modules) {

      action.modules.forEach(function(module) {
        // Remplace le texte en markdown par sa version en html
        module.contexte = module.contexte ? marked(module.contexte) : '';
        module.objectifs = module.objectifs ? marked(module.objectifs) : '';
        module.programme = module.programme ? marked(module.programme) : '';

        // Remplace la durée au format ISO par une durée humainement lisible
        if (module.duree) {
          var duration = moment.duration(module.duree);

          var heures = Math.floor(duration.asHours());
          var minutes = duration.minutes();

          module.duree = heures + ' heures et ' + minutes + ' minutes';

          if (heures >= 7) {
            // On donne une approximation en années/mois/semaines/jours/heures/minutes)
            var approx = humanizeDuration(moment.duration(duration).asMinutes(), {
              language: 'fr',
              units: ['y', 'mo', 'w', 'd', 'h', 'm'],
              unitMeasures: {
                y: 47 * 5 * 7 * 60, // 52 semaines - 5 semaines de congés par an
                mo: 23 * 7 * 60, // 23 jours travaillés par mois
                w: 35 * 60, // 35 heures par semaine
                d: 7 * 60, // 7 heures par jours
                h: 60, // 60 minutes par heure
                m: 1
              }
            });

            module.duree += ' (approximativement ' + approx + ')';
          }


        } else {
          module.duree = '';
        }

      });
    }

    // Remplace les dates au format ISO par une date formattée
    if (action.planifications) {
      action.planifications.forEach(function(planification) {
        if (planification.calendrier) {
          planification.calendrier.forEach(function(evt) {
            evt.debut = evt.debut ? moment(evt.debut).format('D MMMM YYYY') : '';
            evt.fin = evt.fin ? moment(evt.fin).format('D MMMM YYYY') : '';
          })
        }
      });
    }

    // Remplace l'id d'axe par l'axe de formation
    if (action.axe) {
      var axe = req.axeHit._source;
      axe.id = req.axeHit._id;
      delete axe.region;
      delete axe.exercice;
      action.axe = axe;
    }

    req.action = action;
    next();

  };

  var actionToHTML = function(req, res,next) {
    var path = __dirname + '/action.jade';
    var str = fs.readFileSync(path, 'utf-8');
    var fn = pug.compile(str, { filename: path, pretty: true });

    req.document = fn(req.action);
    next();
  };

  var sendResponse = function(req, res) {
      res.send(req.document);
  };

  var previewActionsRouter = express.Router();

  previewActionsRouter.get('/:id', [
    getActionHit,
    getAxeHit,
    mapHitToAction,
    actionToHTML,
    sendResponse
  ]);


  module.exports = previewActionsRouter;
})();
