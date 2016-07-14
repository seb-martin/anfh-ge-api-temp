var stream = require('stream');
var moment = require('moment');

var mapping = require('./anfh_1_0.json');
var ANFH_1_0 = 'anfh_1_0';

module.exports = function(esHelpers) {

  var centresBCStream = function() {
    var readable = stream.Readable({objectMode: true});

    readable._centresbc = require('./centresbc/centres_bc').items.map(function(centre_bc) {
        return {
          id: centre_bc.id,
          derniereModif: centre_bc.derniere_modif ?
            // Formatte la date au format ISO
            moment(centre_bc.derniere_modif, 'DD/MM/YY').toDate().toISOString() :
            undefined,
          region: centre_bc.region,
          idOrg: centre_bc.id_org,
          raisonSociale: centre_bc.raison_sociale,
          siret: centre_bc.siret,
          ape: centre_bc.ape,
          nda: centre_bc.nda,
          dateFinHabilitation: centre_bc.date_fin_habilitation,
          site: centre_bc.site,
          adresse: {
            nom: centre_bc.adresse_nom,
            service: centre_bc.adresse_service,
            pointLocalisation: centre_bc.adresse_point_localisation,
            voie: centre_bc.adresse_voie,
            lieuDit: centre_bc.adresse_lieu_dit,
            // TODO le nom du champs sélectionné devrait être adresse_cp_localite
            cpLocalite: centre_bc.cp_localite

          },
          tel: centre_bc.tel,
          email: centre_bc.email
        };
      });

    readable._read = function(sizeIsIgnored) {
      while ( this._centresbc.length ) {
        var centre = this._centresbc.shift();
        centre._index = ANFH_1_0;
        centre._type = 'centresbc';
        centre._id = centre.id;
        var more = this.push(centre);
        this.emit('centrebc', centre);
        // if (!more) {
        //     break;
        // }
      }

      if ( ! this._centresbc.length ) {
        this.push(null);
      }
    };

    return readable;
  };

  var centresBCBulk = function() {
    return esHelpers.bulker();
  };

  return {
    deleteIndex: function() {
      return esHelpers.deleteIndex({index: ANFH_1_0, ignore: 404})
        .then(function(response) {
          // Si la réponse contient une erreur (404), on la notifie
          var alerte = response.error ? '(L\'index n\'existait pas)' : '';

          console.info('Succès de suppresssion de l\'index', ANFH_1_0, alerte);
        }).catch(function(err) {
          console.error('Echec de suppresssion de l\'index', ANFH_1_0, JSON.stringify(err));
        });
    },

    createIndex: function() {
      return esHelpers.createIndex({
        index: ANFH_1_0,
        body: mapping
      }).then(function(response) {
        console.info('Succès de création de l\'index', ANFH_1_0);
      }).catch(function(err) {
        console.error('Echec de création de l\'index', ANFH_1_0, JSON.stringify(mapping), err);
      });
    },

    recoverCentresBC: function() {
      return centresBCStream()
        .pipe(centresBCBulk())
        .on('end', function() {
          console.info('Succès de reprise des centres de bilans de compétences sur l\'index', ANFH_1_0);
        })
        .on('error', function(err) {
          console.error('Echec de reprise des centres de bilans de compétences sur l\'index', ANFH_1_0, err);
        });
    },

    scrollCentresBC: function() {
      return esHelpers.scroller({
        index: ANFH_1_0,
        type: 'centresbc',
        scroll: '5s',
        size: 5
      });
    },

    createAlias: function(alias) {
      return esHelpers.createAlias({index: ANFH_1_0, name: alias})
        .then(function(response) {
          console.info('Succès de création de l\'alias', alias, 'vers l\'index', ANFH_1_0);
        }).catch(function(err) {
          console.error('Echec de création de l\'alias', alias, 'vers l\'index', ANFH_1_0, JSON.stringify(mapping), err);
        });
    },

    deleteAlias: function(alias) {
      return esHelpers.deleteAlias({index: ANFH_1_0, name: alias})
        .then(function(response) {
          console.info('Succès de suppression de l\'alias', alias, 'vers l\'index', ANFH_1_0);
        }).catch(function(err) {
          console.error('Echec de suppression de l\'alias', alias, 'vers l\'index', ANFH_1_0, JSON.stringify(mapping), err);
        });
    }
  };
};
