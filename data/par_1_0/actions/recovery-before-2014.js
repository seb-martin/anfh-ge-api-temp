var through = require('through2');
// Simple XML to JavaScript object converter
var xml2js = require('xml2js');
// Parse, validate, manipulate, and display dates in JavaScript.
var moment = require('moment');
// An HTML to Markdown converter written in JavaScript.
var toMarkdown = require('to-markdown');

var esHelpers = require('../../es-helpers.js');

var toMarkdownOptions = require('./to-markdown-options.js');

// Dictionnaire associant au nom d'une région son code ANFH
var regionCodes = require('./regions.js');

var recoveryHelpers = require('./recovery-helpers.js');

var parser = new xml2js.Parser();

module.exports = function(index) {
  return through.obj(function(file, enc, cb) {
    var self = this;
    parser.parseString(file.contents, function (err, result) {
      if (err) {
        throw err;
      }

      var bulkArray = [];

      // Itère au travers des actions de formation
      var bulksData = result.node_export.node.map(function(xaction){
        return {
          src: xaction,
          target: {
            action: {}
          }
        };
      })
      .map(function(srctgt) {
        // ID
        srctgt.target.action_id = recoveryHelpers.retriveID(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Région
        srctgt.target.action.region = recoveryHelpers.retriveCodeRegion(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Publie
        srctgt.target.action._publie = recoveryHelpers.retrivePublie(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Intitulé
        srctgt.target.action.intitule = recoveryHelpers.retriveIntitule(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Nature
        srctgt.target.action.nature = recoveryHelpers.retriveNature(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Contexte
        srctgt.target.action.contexte = recoveryHelpers.retriveContexte(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Objectifs
        srctgt.target.action.objectifs = recoveryHelpers.retriveObjectifs(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Titulaire
        srctgt.target.action.titulaire = recoveryHelpers.retriveTitulaire(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Publics
        srctgt.target.action.publics = recoveryHelpers.retrivePublics(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Modules
        srctgt.target.action.modules = recoveryHelpers.retriveModules(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Planifications & Calendriers
        srctgt.target.action.planifications = recoveryHelpers.retriveCalendriers(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Exercice
        var exercice = recoveryHelpers.retriveExercice(srctgt.src);

        // Si l'exercice est < 2015, on l'affecte sur 2015
        srctgt.target.action.exercice = exercice < 2015 ? 2015 : exercice;

        return srctgt;
      })
      .map(function(srctgt) {
        // Ne publie pas les actions de cette reprise
        srctgt.target.action._publie = false;
        return srctgt;
      })
      .map(function(srctgt) {
        // Amélioration de reprise
        var action = srctgt.target.action;

        if (action.exercice === 2016) {
          switch (action.region) {
            case 'ALP':
              var r = /(ALPES\s:\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;

              break;
            case 'AQU':
              var r = /(AQU\s[/:]\s)?(AQUITAINE\s:\s)?(Gpe\s[0-9]\s\-\s)?(AFR\/\/)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[5];
              action.modules[0].intitule = action.intitule;

              break;
            case 'AUV':
              var r = /(AUV\s\/\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;

              break;
            case 'BGN':
              var r = /(BGN\s\-\s)?(Bourgogne\s\-\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[3];
              action.modules[0].intitule = action.intitule;

              break;
            case 'CEN':
              var r = /(CENTRE\s:\s)?(Centre\s:\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[3];
              action.modules[0].intitule = action.intitule;

              break;
            case 'CHA':
              var r = /(AC\s2016\s:\s)?(ANFH\sCHA\s[\-:]\s)?((ANFH\s)?CHAMPAGNE\-ARDENNE\s:\s)?(AR\s:\s)?(.*)/;
              var rr = r.exec(action.intitule);

              if (rr[1] === 'AC 2016 : ') {
                action.nature = 'C';
              }

              action.intitule = rr[6];
              action.modules[0].intitule = action.intitule;

              break;
            case 'DMA':
              var r = /(AFR\sà\svenir\s:\s)?(Martinique\s:\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[3];
              action.modules[0].intitule = action.intitule;

              break;
            case 'FRA':
              var r = /(AR\s:)?(F\.COMTE\s)?(F\.Comté\s:\s)?(FR-COMTE\s\/\s)?(FRA\s\-\s)?(FRA\s)?(FRANCHE-COMTE\s:\s)?(Franche\-Comté\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[9];
              action.modules[0].intitule = action.intitule;

              break;
            case 'HAU':
              var r = /(2016\.\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;

              break;
            case 'LIM':
              var r = /(LIM\s\/\s)?(LIM\/)?(LIM\s)?(LIMOUSIN\s[\/:]\s)?(.*)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[5];
              action.modules[0].intitule = action.intitule;

              break;
            case 'LOR':
              var r = /(.*)(\s-\sRégion\sLorraine)/;
              var rr = r.exec(action.intitule);

              if (rr) {
                action.intitule = rr[1];
                action.modules[0].intitule = action.intitule;
              }

              break;
            case 'MID':
              var r = /((ANFH\s)?MIDI[\-\s]PYRENEES\s\-?\s?)?((AFR\s[0-9]{1,2})(\s+\-?\s?))?(MP\s[\-\/]\s)?(Midi\sPyrénées\s:\s)?(.+)/;
              var rr = r.exec(action.intitule);

              if (rr[4]) {
                action.code = rr[4]
              }

              action.intitule = rr[8];
              action.modules[0].intitule = action.intitule;

              break;
            case 'NOR':
              var r = /(NORD\s?:\s?)?(.+)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;

              break;
            case 'PIC':
              var r = /(AC\s\/\s)?(AFR\s\/\s)?(PIC\s?\/\s?)?(PICARDIE\s:\s)?(Picardie\s:\s)?(.+)/;
              var rr = r.exec(action.intitule);

              if (rr[1]) {
                action.nature = 'C';
              }

              action.intitule = rr[6];
              action.modules[0].intitule = action.intitule;

              break;
            case 'NOR':
              var r = /(PACA\s[\/:]\s?)?(.+)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;

              break;
            case 'REU':
              var r = /(OCEAN\sINDIEN\s:\s)?(Océan\sindien\s?:\s)?(.+)/;
              var rr = r.exec(action.intitule);

              action.intitule = rr[3];
              action.modules[0].intitule = action.intitule;

              break;
            case 'RHO':
              var r = /(AFR\s\-\s)?(PIE\s\-\s)?(RHONE\s[\/:]\s?)?(.+)/;
              var rr = r.exec(action.intitule);

              if (rr[2]) {
                action.nature = 'C'
              }

              action.intitule = rr[4];
              action.modules[0].intitule = action.intitule;

              break;
            default:

          }
        }

        return srctgt;
      })
      .map(function(srctgt) {
        return srctgt.target;
      })
      .filter(function(target) {
        // Rejet des actions sans code région
        if (!target.action.region) {
          console.warn('Action d\'ID ' + target.action_id + ' (' + target.action.intitule + ') rejetéé : Impossible de déterminer la région');
        }
        return target.action.region;
      })
      .filter(function(target) {
        // Rejet des actions sans exercice
        if (!target.action.exercice) {
          console.warn('Action d\'ID ' + target.action_id + ' (' + target.action.intitule + ') rejetéé : Impossible de déterminer l\'exercice');
        }
        return target.action.exercice;
      })
      .forEach(function(target) {

        target.action._index = index;
        target.action._type = 'actions';
        target.action._id = target.action_id;
        
        self.push(target.action);
      });

      cb();
    });
  });

};
