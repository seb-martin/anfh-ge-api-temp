// File System : Permet de faire des lectures/écritures sur le système de fichiers
var fs = require('fs');
// Parse, validate, manipulate, and display dates in JavaScript.
var moment = require('moment');
// An HTML to Markdown converter written in JavaScript.
var toMarkdown = require('to-markdown');
var toMarkdownOptions = require('./to-markdown-options.js');
// Dictionnaire associant au nom d'une région son code ANFH
var regionCodes = require('./regions.js');



var makedir = function(directory) {
  try {
    fs.accessSync(directory);
    console.info(`Répertoire \'${directory}\' existant`);
  } catch(err) {
    fs.mkdir(directory, function(err) {
      if (err) {
        console.error(`Impossible de créer le répertoire \'${directory}\'`, err);
        throw err;
      }
      console.info(`Répertoire \'${directory}\' créé`);
    });
  }
};

var retriveID = function(src) {
  return src.nid[0];
};

var retriveIntitule = function(src) {
  return src.title[0].trim();
};

var retriveCodeRegion = function(src) {
  // Région

  var nodeName = Object.getOwnPropertyNames(src.og_groups_both[0])[0]
  var codeReg = regionCodes[src.og_groups_both[0][nodeName][0]];
  return codeReg ? codeReg : undefined;
};

var retrivePublie = function(src) {
  return src.og_public[0]._ === 'TRUE';
};

var retriveNature = function(src) {
  // Toutes les actions reprisent sont considérées comme étant régionales
  return 'R';
};

var retriveContexte = function(src) {


  if (
    src.field_contexte && src.field_contexte.length > 0 &&
    typeof src.field_contexte[0].n0[0].value[0] === 'string'
  ) {
    return toMarkdown(src.field_contexte[0].n0[0].value[0], toMarkdownOptions).trim();
  } else {
    return undefined;
  }
};

var retriveObjectifs = function(src) {
  if (
    src.field_objectif && src.field_objectif.length > 0 &&
    typeof src.field_objectif[0].n0[0].value[0] === 'string'
  ) {
    return toMarkdown(src.field_objectif[0].n0[0].value[0], toMarkdownOptions).trim();
  } else {
    return undefined;
  }
};

var retriveTitulaire = function(src) {
  if (src.field_organisateur && src.field_organisateur.length > 0) {
    return src.field_organisateur[0].n0[0].value[0];
  }
};

var retrivePublics = function(src) {
  if (src.field_public) {
    return src.field_public.map(function(item) {
      if (typeof item.n0[0].value[0] === 'string') {
        return toMarkdown(item.n0[0].value[0], toMarkdownOptions).trim();
      } else {
        return undefined;
      }
    })
    .filter(function(public) {
      return public;
    }).sort();
  } else {
    return [];
  }
};

var retriveProgrammeModule = function(src) {
  if (typeof src.body[0] === 'string') {
    return toMarkdown(src.body[0], toMarkdownOptions).trim();
  }
};

var retriveDureeModule = function(src) {
  if (
    src.field_af_duree && src.field_af_duree.length > 0 &&
    typeof src.field_af_duree[0].n0[0].value[0] === 'string'
  ) {
    try {
      var nbJours = parseInt(src.field_af_duree[0].n0[0].value[0]);
      return 'P' + nbJours + 'D'
    } catch (err) {
      console.warn('La durée n\'est pas un entier',  src.field_af_duree[0].n0[0].value[0], err);
      throw err;
    }
  }
};

var retriveModules = function(src) {

  /*
  Il n'y a pas de notion de module dans les données reprises.
  Cependant, des informations à reprendre sont situés au niveau du module :
  - programme
  - durée

  --> On crée UN module
  --> On lui affecte le numéro 1
  --> On réplique des infos de l'action :
      - intitulé du module = intitulé de l'action
  */

  return [{
    num: 1,
    intitule: retriveIntitule(src),
    programme: retriveProgrammeModule(src),
    duree: retriveDureeModule(src)
  }];
};

var retriveVille = function(src) {
  /*
  Les évènements repris dans le calendrier ne comporte pas de notion
  de ville ou de lieu.

  Il existe un champs spécifique pour le lieu de formation.
  --> On récupère ce lieu et on l'affecte comme ville à l'ensemble des
      dates du calendrier.
  */

  if (
    src.field_lieu_formation && src.field_lieu_formation.length > 0 &&
    typeof src.field_lieu_formation[0].n0[0].value[0] === 'string'
  ) {
    return src.field_lieu_formation[0].n0[0].value[0];
  }
};

var retriveCalendriers = function(src) {

  if (src.field_date_evt && src.field_date_evt.length > 0) {
    var ville = retriveVille(src);

    return Object.getOwnPropertyNames(src.field_date_evt[0]).filter(function(nodeName) {
      return nodeName !== '$';
    }).map(function(nodeName) {
      var n = src.field_date_evt[0][nodeName][0];
      if (typeof n.value[0] === 'string') {
        var itemCalendrier = {
          debut: moment(n.value[0].substring(0, 'YYYY-MM-DD'.length)).format('YYYY-MM-DD'),
          fin: moment(n.value2[0].substring(0, 'YYYY-MM-DD'.length)).format('YYYY-MM-DD'),
          ville: ville
        };

        return itemCalendrier;
      } else {
        return undefined;
      }
    }).filter(function(itemCalendrier) {
      return itemCalendrier;
    }).map(function(itemCalendrier) {
      return {calendrier: [itemCalendrier]};
    }).sort(function(plan1, plan2) {
      if (plan1.calendrier[0].debut < plan2.calendrier[0].debut) {
        return -1;
      } else if (plan1.calendrier[0].debut > plan2.calendrier[0].debut) {
        return 1;
      } else {
        return 0;
      }
    });

  } else {
    return [];
  }

};

var retriveExercice = function(src) {
  /*
  Il n'existe pas de notion d'exercice dans les données reprise.

  on cherche un exercice dans l'intitulé de l'action
  A défaut, On détermine l'exercice en prenant la plus petite date de début dans le calendrier
  A défaut d'exercice dans l'intitulé, on utilise le champ 'revision_timestamp'
  http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
  */

  var intitule = retriveIntitule(src);
  var planifications = retriveCalendriers(src);

  var exeMatch = intitule.match(/(201[0-9])/g);

  var exercice;

  if (exeMatch) {
    exercice = parseInt(exeMatch[0]);
  } else if (planifications.length > 0) {
    exercice = planifications.map(function(planif) {
      return parseInt(planif.calendrier[0].debut.substring(0, 'YYYY'.length));
    }).reduce(function(m, exe) {
      return m < exe ? exe : m;
    });
  } else {
    // Utilisation du revision_timestamp
    exercice = new Date(parseInt(src.revision_timestamp[0]) * 1000).getFullYear();
  }

  return exercice;
};

exports.makedir = makedir;
exports.retriveID = retriveID;
exports.retriveCodeRegion = retriveCodeRegion;
exports.retrivePublie = retrivePublie;
exports.retriveIntitule = retriveIntitule;
exports.retriveNature = retriveNature;
exports.retriveContexte = retriveContexte;
exports.retriveObjectifs = retriveObjectifs;
exports.retriveTitulaire = retriveTitulaire;
exports.retrivePublics = retrivePublics;
exports.retriveModules = retriveModules;
exports.retriveCalendriers = retriveCalendriers;
exports.retriveExercice = retriveExercice;
