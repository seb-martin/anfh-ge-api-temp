/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

(function(document) {
  'use strict';

  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector('#app');

  // Sets app default base URL
  app.baseUrl = '/';
  if (window.location.port === '') {  // if production
    // Uncomment app.baseURL below and
    // set app.baseURL to '/your-pathname/' if running from folder in production
    // app.baseUrl = '/polymer-starter-kit/';
  }

  app.displayInstalledToast = function() {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#caching-complete').show();
    }
  };

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', function() {
    console.log('Our app is ready to rock!');
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    // imports are loaded and elements have been registered

  });

  // Main area's paper-scroll-header-panel custom condensing transformation of
  // the appName in the middle-container and the bottom title in the bottom-container.
  // The appName is moved to top and shrunk on condensing. The bottom sub title
  // is shrunk to nothing on condensing.
  window.addEventListener('paper-header-transform', function(e) {
    var appName = Polymer.dom(document).querySelector('#mainToolbar .app-name');
    var middleContainer = Polymer.dom(document).querySelector('#mainToolbar .middle-container');
    var bottomContainer = Polymer.dom(document).querySelector('#mainToolbar .bottom-container');
    var detail = e.detail;
    var heightDiff = detail.height - detail.condensedHeight;
    var yRatio = Math.min(1, detail.y / heightDiff);
    // appName max size when condensed. The smaller the number the smaller the condensed size.
    var maxMiddleScale = 0.50;
    var auxHeight = heightDiff - detail.y;
    var auxScale = heightDiff / (1 - maxMiddleScale);
    var scaleMiddle = Math.max(maxMiddleScale, auxHeight / auxScale + maxMiddleScale);
    var scaleBottom = 1 - yRatio;

    // Move/translate middleContainer
    Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', middleContainer);

    // Scale bottomContainer and bottom sub title to nothing and back
    Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)', bottomContainer);

    // Scale middleContainer appName
    Polymer.Base.transform('scale(' + scaleMiddle + ') translateZ(0)', appName);
  });

  // Scroll page to top and expand header
  app.scrollPageToTop = function() {
    app.$.headerPanelMain.scrollToTop(true);
  };

  app.closeDrawer = function() {
    app.$.paperDrawerPanel.closeDrawer();
  };

  // Personnalisations

  app.computeLoading = function(_regionsLoading, _axesLoading, _actionsLoading) {
    return _regionsLoading || _axesLoading || _actionsLoading;
  };

  app.showDelegations = function() {
    // Retire la région sélectionnée pour ne pas être redirigé lors du routage
    app._region = null;
    page(app.baseUrl);
  };

  app.showRegion = function(evt) {
    var region = evt.detail.region || app._region;

    page(app.baseUrl + region.code);
  };

  app.showAxes = function(evt) {
    var exercice = evt.detail.exercice || app._exercice;

    page(app.baseUrl + app._region.code + '/' + exercice + '/axes');
  };

  app.newAxe = function() {
    page(app.baseUrl + app._region.code + '/' + app._exercice + '/axes/nouveau');
  };

  app.editAxe = function(evt) {
    var axeid = evt.detail.axe._id;

    page(app.baseUrl + app._region.code + '/' + app._exercice + '/axes/' + axeid);
  };

  app.deleteAxe = function(evt) {
    app.$.axesData.supprimer(evt.detail.axe)
      .then(function() {
        app.$.toast.text = 'Axe supprimé';
        app.$.toast.open();
      })
      .then(function() {
        app.showAxes(evt);
      }).catch(app.catchError);
  };

  app.createAxe = function(evt) {
    app.$.axesData.creer(evt.detail.axe)
      .then(function(axe) {
        app.$.toast.text = 'Axe créé';
        app.$.toast.open();
        return axe;
      })
      .then(function(axe) {
        evt.detail.axe = axe;
        app.editAxe(evt);
      }).catch(app.catchError);
  };

  app.updateAxe = function(evt) {
    app.$.axesData.modifier(evt.detail.axe)
      .then(function(axe) {
        app.$.toast.text = 'Axe mis à jour';
        app.$.toast.open();
        return axe;
      })
      .then(function(axe) {
        evt.detail.axe = axe;
        app._axe = axe;
      }).catch(app.catchError);

  };

  app.refreshActions = function() {
    app.$.actionsData.refresh().catch(app.catchError);
  };

  app.showActions = function(evt) {
    var exercice = evt.detail.exercice || app._exercice;

    page(app.baseUrl + app._region.code + '/' + exercice + '/actions');
  };

  app.newAction = function() {
    page(app.baseUrl + app._region.code + '/' + app._exercice + '/actions/nouveau');
  };

  app.editAction = function(evt) {
    var actionid = evt.detail.action._id;

    page(app.baseUrl + app._region.code + '/' + app._exercice + '/actions/' + actionid);
  };

  app.deleteAction = function(evt) {
    app.$.actionsData.supprimer(evt.detail.action)
      .then(function() {
        app.$.toast.text = 'Action supprimée';
        app.$.toast.open();
      })
      .then(function() {
        app.showActions(evt);
      }).catch(app.catchError);
  };

  app.createAction = function(evt) {
    app.$.actionsData.creer(evt.detail.action)
      .then(function(action) {
        app.$.toast.text = 'Action créée';
        app.$.toast.open();
        return action;
      })
      .then(function(action) {
        evt.detail.action = action;
        app.editAction(evt);
      }).catch(app.catchError);
  };

  app.updateAction = function(evt) {
    app.$.actionsData.modifier(evt.detail.action)
      .then(function(action) {
        app.$.toast.text = 'Action mise à jour';
        app.$.toast.open();
        return action;
      })
      .then(function(action) {
        evt.detail.action = action;
        app._action = action;
      }).catch(app.catchError);
  };

  app.duplicateAction = function(evt) {
    // On change de région, si nécessaire
    if (app._region.code !== evt.detail.action.region) {
      app._region = app._regions.reduce(function(prev, current) {
        return current.code === evt.detail.action.region ? current : prev;
      }, null);
    }

    // On change d'exercice, si nécessaire
    if (app._exercice !== evt.detail.action.exercice) {
      app._exercice = evt.detail.action.exercice;
    }

    app.$.actionsData.creer(evt.detail.action)
      .then(function(action) {
        app.$.toast.text = 'Action dupliquée';
        app.$.toast.open();
        return action;
      })
      .then(function(action) {
        // On change de vue
        evt.detail.action = action;
        app.showActions(evt);
      }).catch(app.catchError);

  };

  app.catchError = function(err) {
    app.$.toastError.text = JSON.stringify(err);
    app.$.toastError.open();
  };

})(document);
