(function() {
  // File System : Permet de faire des lectures/écritures sur le système de fichiers
  var fs = require('fs');
  var path = require('path');
  // Simple XML to JavaScript object converter
  var xml2js = require('xml2js');
  // Parse, validate, manipulate, and display dates in JavaScript.
  var moment = require('moment');
  // An HTML to Markdown converter written in JavaScript.
  var toMarkdown = require('to-markdown');
  var toMarkdownOptions = require('./to-markdown-options.js');

  // Dictionnaire associant au nom d'une région son code ANFH
  var regionCodes = require('./regions.js');

  var recoveryHelpers = require('./recovery-helpers.js');

  var parser = new xml2js.Parser();

  var inputFile = path.join(__dirname, 'export-supersoniks', 'offres_formations_apartirde_2014.xml');
  var outpoutDirectory = path.join(__dirname, 'es-bulk');
  var outpoutFile = path.join(outpoutDirectory, 'actions-apartirde-2014.json');

  // Crée le répertoire de sortie, s'il n'existe pas
  recoveryHelpers.makedir(outpoutDirectory);

  fs.readFile(inputFile, function(err, data) {
    if (err) {
      throw err;
    }

    parser.parseString(data, function (err, result) {
      if (err) {
        throw err;
      }

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
        srctgt.target.action.exercice = recoveryHelpers.retriveExercice(srctgt.src);
        return srctgt;
      })
      .map(function(srctgt) {
        // Amélioration de reprise
        var action = srctgt.target.action;

        if (action.region === 'ALP') {
          // Aucune action à reprendre
        } else if(action.region === 'ALS') {
          // Aucune action à reprendre
        } else if(action.region === 'AQU') {
          if (action.exercice === 2015) {
            var r = /Gpe\s[0-9]\s\-\sAFR\s\/\s(.*)/;
            var rr = r.exec(action.intitule);

            action.intitule = rr[1];
            action.modules[0].intitule = action.intitule;
          } else if (action.exercice === 2016) {
            var r = /AXE\s([0-9])\s\/\s(.*)\s[\-:]\s*(.*)/;
            var rr = r.exec(action.intitule);

            srctgt.target.axe = {
              region: action.region,
              exercice: action.exercice,
              num: parseInt(rr[1]),
              intitule: rr[2]
            };

            srctgt.target.axe_id = [
              'AXE',
              action.region,
              action.exercice,
              rr[1]
            ].join('-');

            action.axe = srctgt.target.axe_id;

            action.intitule = rr[3] ? rr[3] : rr[2];
            action.modules[0].intitule = action.intitule;
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'AUV') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            var r = /(AF[CR]\s[0-9]*)\s{0,1}\-\s{0,1}(.*)/;
            var rr = r.exec(action.intitule);

            if (rr[1].substr(0, 3) === 'AFC') {
              action.nature = 'C';
            }

            action.code = rr[1];
            action.intitule = rr[2];
            action.modules[0].intitule = action.intitule;
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'BAS') {
          // Aucune action à reprendre
        } else if(action.region === 'BGN') {
          // Aucune amélioration apportée
        } else if(action.region === 'BRE') {
          var r = /(AF[CRN]\s?[0-9]+[\-A-Z]*)(\-[0-9]{0,4})?\s?\-?\s(.*)/;
          var rr = r.exec(action.intitule);

          if (rr) {
            action.code = rr[1];

            if (rr[1].substr(0, 3) === 'AFN') {
              action.nature = 'N';
            } else if (rr[1].substr(0, 3) === 'AFC') {
              action.nature = 'C';
            }

            action.intitule = rr[3];
            action.modules[0].intitule = action.intitule;
          }
        } else if(action.region === 'CEN') {
          if (action.exercice === 2015) {
            var r = /([A-Z][0-9]*)\s:\s(AFN)\s2015\s[\-:]\s(.*)/;
            var rr = r.exec(action.intitule);

            action.code = rr[1];

            if ('AFN' === rr[2]) {
              action.nature = 'N';
            }

            action.intitule = rr[3];
            action.modules[0].intitule = action.intitule;
          } else if (action.exercice === 2016) {

            var r = /([A-Z][0-9]+[\-]?[0-9]?)\s+[\-:]?\s?(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              action.code = rr[1];
              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;
            }

          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'CHA') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            var r = /(?:Emplois d'Avenir\s\-\s)?(AC|AR|AFN)(?:\s+2016)?(?:\s+[\-:]\s*)?(?:NOUVEAUTE\s:\s)?(.*)/;
            var rr = r.exec(action.intitule);

            if ('AFN' === rr[1]) {
              action.nature = 'N';
            } else if ('AC' === rr[1]) {
              action.nature = 'C';
            }

            action.intitule = rr[2];
            action.modules[0].intitule = action.intitule;
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'COR') {
          if (action.exercice === 2015) {
            // Aucune amélioration apportée
          } else if (action.exercice === 2016) {
            var r = /(AFN)\s2016\s[\-:]\s(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              if (rr[1] === 'AFN') {
                action.nature = 'N';
              }
              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'FRA') {
          var r = /(AC|AR|AFN)(?:\s+201[5-6]\s)?(?:FRA\s?\-\s?)(.*)/;
          var rr = r.exec(action.intitule);

          if (rr[1] === 'AFN') {
            action.nature = 'N';
          } else if (rr[1] === 'AC') {
            action.nature = 'C';
          }

          action.intitule = rr[2];
          action.modules[0].intitule = action.intitule;

        } else if(action.region === 'DGY') {
          if (action.exercice === 2015) {
            // Aucune amélioration apportée
          } else if (action.exercice === 2016) {
            // Aucune action à reprendre
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'HAU') {
          var r = /(AFN|AFR|AIE)(?:\s?[\-\/]\s?)(.*)/;
          var rr = r.exec(action.intitule);

          if (rr[1] === 'AFN') {
            action.nature = 'N';
          } else if (rr[1] === 'AIE') {
            action.nature = 'C';
          }

          action.intitule = rr[2];
          action.modules[0].intitule = action.intitule;

        } else if(action.region === 'IDF') {
          if (action.exercice === 2015) {
            var r = /IDF 2016\s+[\-:]?\s?(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              action.intitule = rr[1];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2016) {
            var r = /IDF 2016\s+[\-:]?\s?(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              action.intitule = rr[1];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'LAN') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            // Aucune action à reprendre
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'LIM') {
          if (action.exercice === 2015) {
            // Aucune amélioration apportée
          } else if (action.exercice === 2016) {
            var r = /NOUVEAU\s+[!:]?\s?(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              action.intitule = rr[1];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'LOR') {
          if (action.exercice === 2015) {
            var r = /(AFR\s[0-9]+)\/2015\s\-\s(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              action.code = rr[1];
              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2016) {
            // Aucune action à reprendre
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'DMA') {
          if (action.exercice === 2015) {
            // Aucune amélioration apportée
          } else if (action.exercice === 2016) {
            var r = /(AF[RN])\s\-\s(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              if ('AFN' === rr[1]) {
                action.nature = 'N';
              }
              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'MID') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            var r = /\s?MIDI PYRENEEE?S\s?\-\s?([A-Z]{3}\s*[0-9]+)\s?\-?\s(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              action.code = rr[1];
              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'NOR') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            // Aucune action à reprendre
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'REU') {
          var r = /(?:(?:OCEAN INDIEN|OCÉAN INDIEN|OCI|Océan Indien)\s*[\-:]\s*)?(?:201[5-6]\s?\-\s)?(?:ANFH OCÉAN INDIEN\s\-\s|OCEAN INDIEN\s\-\s)?(DPC)?(?:\s\-\s)?(AAP|AFC|AFN)?(?:\s\-\s)?(?:\s2016\s\-\s)?(.*)/;
          var rr = r.exec(action.intitule);

          if (rr[1] === 'DPC') {
            action.typologie = '0';
          }

          if (rr[2] === 'AFN') {
            action.nature = 'N';
          }

          action.intitule = rr[3];
          action.modules[0].intitule = action.intitule;
        } else if(action.region === 'PAY') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            // Aucune amélioration apportée
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'PIC') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            var r = /PIC\/(AF[RNC][0-9]+)?\s*(.*)/;
            var rr = r.exec(action.intitule);

            if (rr[1]) {
              if (rr[1].substr(0, 3) === 'AFN') {
                action.nature = 'N';
              } else if (rr[1].substr(0, 3) === 'AFC') {
                action.nature = 'C';
              }
            }

            action.code = rr[1];
            action.intitule = rr[2];
            action.modules[0].intitule = action.intitule;
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'POI') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            var r = /(AFN)\s*201[0-9]\s*[\/:]\s?(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              if ('AFN' === rr[1]) {
                action.nature = 'N';
              }
              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
          }
        } else if(action.region === 'PRO') {
          var r = /PACA\/\sAFFR\s2016\s\/\s(.*)/;
          var rr = r.exec(action.intitule);

          if (rr) {
            action.intitule = rr[1];
            action.modules[0].intitule = action.intitule;
          }

          r = /\s?(AF[NR])\s*201[0-9]\s*[\/:]\s?(PACA)?\s*\/?\s(.*)&/;
          rr = r.exec(action.intitule);

          if (rr) {
            if ('AFN' === rr[1]) {
              action.nature = 'N';
            }
            action.intitule = rr[3];
            action.modules[0].intitule = action.intitule;
          }

        } else if(action.region === 'RHO') {
          if (action.exercice === 2015) {
            // Aucune action à reprendre
          } else if (action.exercice === 2016) {
            var r = /(PIE|AFN|AFR)\s?\-?\s?(.*)/;
            var rr = r.exec(action.intitule);

            if (rr) {
              if ('AFN' === rr[1]) {
                action.nature = 'N';
              } else if ('PIE' === rr[1]) {
                action.nature = 'C';
              }

              action.intitule = rr[2];
              action.modules[0].intitule = action.intitule;
            }
          } else if (action.exercice === 2017) {
            // Aucune action à reprendre
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
      .map(function(target) {

        var bulkArray = [];
        if (target.axe) {
          bulkArray.push(JSON.stringify({index: {_index: 'par', _type: 'axes', _id: target.axe_id}}));
          bulkArray.push(JSON.stringify(target.axe));
        }

        bulkArray.push(JSON.stringify({index: {_index: 'par', _type: 'actions', _id: target.action_id}}));
        bulkArray.push(JSON.stringify(target.action));

        return bulkArray;
      }).map(function(bulkArray) {
        return bulkArray.join('\n');
      }).join('\n');


      fs.writeFile(outpoutFile, bulksData, function(err) {
        if (err) {
          throw err;
        }
      });

    });
  });


})();
