(function(global) {
  'use strict';

  var REPO_NAME = 'par_repo';

  var gulp = require('gulp');
  var readline = require('readline');
  var minimist = require('minimist');
  var elasticsearch = require('elasticsearch');

  var dbHost = process.env.DB_PORT_9200_TCP_ADDR || 'localhost';
  var dbPort = process.env.DB_PORT_9200_TCP_PORT || 9200;
  var args = minimist(process.argv.slice(2));

  var client = new elasticsearch.Client({
    host: [dbHost, dbPort].join(':')
    //, log: 'trace'
  });

  var messages = {
    backup: {
      init: {
        start: 'Initialisation des sauvegardes ...',
        success: [
          'Initialisation des sauvegardes réalisée avec succès',
          '(Référentiel <repo> créé ou déjà existant)'
        ].join(' '),
        fail: [
          'Echec de l\'initialisation des sauvegardes',
          '(Référentiel <repo>)'
        ].join(' ')
      },
      destroy: {
        confirm: 'Etes-vous sûr de vouloir détruire les sauvegardes ? [y/N]',
        abort: 'Destruction des sauvegardes abandonnée',
        start: 'Destruction des sauvegardes ...',
        success: [
          'Destruction des sauvegardes réalisée avec succès',
          '(Référentiel <repo> supprimé ou inexistant)'
        ].join(' '),
        fail: [
          'Echec de destruction des sauvegardes',
          '(Référentiel <repo>)'
        ].join(' ')
      },
      snapshot: {
        question: 'Nom de l\'instantané ? [<snap>]',
        start: 'Prise de l\'instantané, souriez ;-) ...',
        success: [
          'L\'instantané <snap> a été créé avec succès',
          '(Référentiel <repo>)'
        ].join(' '),
        fail: [
          'Echec de création de l\'instantané',
          '(Référentiel <repo>)'
        ].join(' ')
      },
      list: {
        start: 'Listage des instantanés ...',
        item: '<date_iso> : <snap>',
        success: '<count> instantané(s) (Référentiel <repo>)',
        fail: 'Echec du listage des instantanés (Référentiel <repo>)'
      },
      restore: {
        confirm: 'Etes-vous sûr de vouloir restaurer l\'instantané <snap> ? [y/N]',
        question: 'Nom de l\'instantané ? [Laisser vide pour abandonner la restauration]',
        abort: 'Restauration de l\'instantané abandonnée',
        start: 'Restauration de l\'instantané <snap> ...',
        success: [
          'Restauration de l\'instantané <snap> réalisée avec succès',
          '(Référentiel <repo>)'
        ].join(' '),
        fail: [
          'Echec de la restauration de \'instantané <snap>',
          '(Référentiel <repo>)'
        ].join(' ')
      },
      delete: {
        confirm: 'Etes-vous sûr de vouloir supprimer l\'instantané <snap> ? [y/N]',
        question: 'Nom de l\'instantané ? [Laisser vide pour abandonner la suppression]',
        abort: 'Suppression de l\'instantané abandonnée',
        start: 'Suppression de l\'instantané <snap> ...',
        success: [
          'Suppression de l\'instantané <snap> réalisée avec succès',
          '(Référentiel <repo>)'
        ].join(' '),
        fail: [
          'Echec de la suppression de l\'instantané <snap>',
          '(Référentiel <repo>)'
        ].join(' ')
      }
    }
  };


  var createRLI = function() {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  };

  // cb (callback) est nécessaire
  // pour gérer l'asynchronisme de la tâche
  // https://github.com/gulpjs/gulp/blob/master/docs/API.md#gulptaskname--deps-fn
  gulp.task('backup-init', function(cb) {
    console.info(messages.backup.init.start);
    client.snapshot.createRepository({
      verify: true,
      repository: REPO_NAME,
      body: {
        type: 'fs',
        settings: {
          location: REPO_NAME,
          compress: true
        }
      }
    }).then(function(body) {
      console.info(messages.backup.init.success.replace('<repo>', REPO_NAME));
      cb();
    }).catch(function(err) {
      console.error(messages.backup.init.fail.replace('<repo>', REPO_NAME));
      cb(err);
    });
  });

  gulp.task('backup-destroy', function(cb) {

    var dodest = function() {
      console.info(messages.backup.destroy.start);

      client.snapshot.deleteRepository({
        ignore: [404],
        repository: REPO_NAME
      }).then(function(body) {
        console.info(
          messages.backup.destroy.success.replace('<repo>', REPO_NAME)
        );
        cb();
      }).catch(function(err) {
        console.error(messages.backup.destroy.fail.replace('<repo>', REPO_NAME));
        cb(err);
      });
    };

    var force = args.force;

    if (!force) {
      var rl = createRLI();

      rl.question(
        messages.backup.destroy.confirm,
        function(answer) {
          if (['y', 'Y', 'o', 'O'].indexOf(answer) !== -1) {
            dodest();
          } else {
            console.info(messages.backup.destroy.abort);
            cb();
          }

          rl.close();
        }
      );
    } else {
      dodest();
    }


  });

  gulp.task('backup-snapshot', function(cb) {

    var defaultSnapshotName = function() {
      var timestamp = new Date().toISOString().toLowerCase();
      return "par-snapshot-" + timestamp;
    };

    var dosnap = function(snapshot) {
      console.info(messages.backup.snapshot.start);
      return client.snapshot.create({
        repository: REPO_NAME,
        snapshot: snapshot,
        waitForCompletion: true,
        body: {
          indices: ['par'],
          include_global_state: false
        }
      }).then(function(body) {
        console.info(
          messages.backup.snapshot.success
          .replace('<snap>', snapshot)
          .replace('<repo>', REPO_NAME)
        );
        cb();
      }).catch(function(err) {
        console.error(
          messages.backup.snapshot.fail
          .replace('<snap>', snapshot)
          .replace('<repo>', REPO_NAME)
        );
        cb(err);
      });
    };

    var snapshot = args.snapshot;
    var force = args.force;

    if (force) {
      if (!snapshot || typeof snapshot === 'boolean') {
        dosnap(defaultSnapshotName());
      } else {
        dosnap(snapshot);
      }
    } else {
      if (!snapshot || typeof snapshot === 'boolean') {
        var rl = createRLI();

        snapshot = defaultSnapshotName();
        rl.question(
          messages.backup.snapshot.question.replace('<snap>', snapshot),
          function(answer) {
            if (answer) {
              snapshot = answer;
            }

            rl.close();

            dosnap(snapshot);
          }
        );
      } else {
        dosnap(snapshot);
      }
    }

  });

  gulp.task('backup-list', function(cb) {
    console.info(messages.backup.list.start);

    var filter = args.filter;

    client.snapshot.get({
      repository: REPO_NAME,
      snapshot: filter || '_all'
    }).then(function(body) {
      body.snapshots.sort(function(s1, s2) {
        return s2.end_time_in_millis - s1.end_time_in_millis;
      }).forEach(function(snapshot) {
        console.info(
          messages.backup.list.item
          .replace('<date_iso>', snapshot.end_time)
          .replace('<snap>', snapshot.snapshot)
        );
      });
      console.info(
        messages.backup.list.success
        .replace('<count>', body.snapshots.length)
        .replace('<repo>', REPO_NAME)
      );
      cb();
    }).catch(function(err) {
      console.error(
        messages.backup.list.fail
        .replace('<repo>', REPO_NAME)
      );
      cb(err);
    });
  });

  gulp.task('backup-restore', function(cb) {

    var doresto = function(snapshot) {
      console.info(messages.backup.restore.start.replace('<snap>', snapshot));
      client.snapshot.restore({
        repository: REPO_NAME,
        snapshot: snapshot
      }).then(function(body) {
        console.info(
          messages.backup.restore.success
          .replace('<snap>', snapshot)
          .replace('<repo>', REPO_NAME)
        );
        cb();
      }).catch(function(err) {
        console.error(
          messages.backup.restore.fail
          .replace('<snap>', snapshot)
          .replace('<repo>', REPO_NAME)
        );
        cb(err);
      });
    };

    var snapshot = args.snapshot;
    var force = args.force;

    if (snapshot && typeof snapshot !== 'boolean') {
      if (!force) {
        var rl = createRLI();
        rl.question(
          messages.backup.restore.confirm.replace('<snap>', snapshot),
          function(answer) {
            if (['y', 'Y', 'o', 'O'].indexOf(answer) !== -1) {
              dodel(snapshot);
            } else {
              console.info( messages.backup.restore.abort );
              cb();
            }

            rl.close();

          }
        );

      } else {
        doresto(snapshot);
      }
    } else {
      var rl = createRLI();

      rl.question(
        messages.backup.restore.question,
        function(answer) {
          snapshot = answer;
          if (snapshot) {
            dosnap(snapshot);
          } else {
            console.info(
              messages.backup.restore.abort
            );
            cb();
          }

          rl.close();

        }
      );

    };

  });

  gulp.task('backup-delete', function(cb) {
    var dodel = function(snapshot) {
      console.info(messages.backup.delete.start.replace('<snap>', snapshot));
      client.snapshot.delete({
        ignore: [404],
        repository: REPO_NAME,
        snapshot: snapshot
      }).then(function(body) {
        console.info(
          messages.backup.delete.success
          .replace('<snap>', snapshot)
          .replace('<repo>', REPO_NAME)
        );
        cb();
      }).catch(function(err) {
        console.error(
          messages.backup.delete.fail
          .replace('<snap>', snapshot)
          .replace('<repo>', REPO_NAME)
        );
        cb(err);
      });
    };

    var snapshot = args.snapshot;
    var force = args.force;

    if (snapshot && typeof snapshot !== 'boolean') {
      if (!force) {
        var rl = createRLI();
        rl.question(
          messages.backup.delete.confirm.replace('<snap>', snapshot),
          function(answer) {
            if (['y', 'Y', 'o', 'O'].indexOf(answer) !== -1) {
              dodel(snapshot);
            } else {
              console.info( messages.backup.delete.abort );
              cb();
            }

            rl.close();

          }
        );

      } else {
        dodel(snapshot);
      }

    } else {

      var rl = createRLI();
      rl.question(
        messages.backup.delete.question,
        function(answer) {
          snapshot = answer;
          if (snapshot) {
            dodel(snapshot);
          } else {
            console.info( messages.backup.delete.abort );
            cb();
          }

          rl.close();

        }
      );

    }

  });

  gulp.task('default', function() {
    console.info('init                 : Initialise le référentiel des sauvegardes');
    console.info('snapshot             : Réalise un instantané de la base de données');
    console.info('  --snapshot <snap>    Nom de l\'instantané');
    console.info('  --force              Pas de question, nom d\'instantané par défaut');
    console.info('list                 : Liste les instantanés disponibles');
    console.info('  --filtre <filtre>    Filtre la liste, * acceptée');
    console.info('restore              : Restaure un instantané');
    console.info('  --snapshot <snap>    Nom de l\'instantané');
    console.info('  --force              Pas de confirmation');
    console.info('delete               : Supprime un instantané');
    console.info('  --snapshot <snap>    Nom de l\'instantané');
    console.info('  --force              Pas de confirmation');
    console.info('destroy              : Détruit le référentiel des sauvegardes');
    console.info('  --force              Pas de confirmation');
  });
})(this);
