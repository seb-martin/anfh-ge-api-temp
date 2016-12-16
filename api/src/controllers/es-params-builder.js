'use strict';

var ESQ = require('esq');


class ParamsBuilder {

  constructor(index, type, bindings) {
    this._esq = new ESQ();
    this._esq.query('index', index);
    this._esq.query('type', type);
    this._bindings = bindings;
  }

  getParams(args) {
    return this.id(args.id.value);
  }

  searchParams(args) {
    return Object.getOwnPropertyNames(args).reduce(function(self, argName) {
      var arg = args[argName];

      switch(arg.schema.name) {
        case 'offset':
          self.from(arg.value);
          break;
        case 'limit':
          self.size(arg.value);
          break;
        case 'q':
          self.fulltext(arg.value);
          break;
        case 'sortedBy':
          self.sort(arg.value);
          break;
        default:
          self.filter(arg.schema.name, arg.value);
          break;
      }
      return self;
    }, this);
  }

  id(id) {
    this._esq.query('id', id);
    return this;
  }

  from(offset) {
    this._esq.query('from', offset);
    return this;
  }

  size(limit) {
    this._esq.query('size', limit);
    return this;
  }

  fulltext(q) {
    if (q) {
      this._esq.query('body', 'query', 'bool', 'must', { query_string: { query: q } });
    }
    return this;
  }

  filter(fieldName, value) {
    var fieldBinding = this._bindings[fieldName];
    if (value) {
      var tokens;
      if (fieldBinding.type === 'string' && fieldBinding.index !== 'not_analyzed') {
        // On split pour créer une liste de jetons
        // l'apostrophe n'est pas analysée par ES comme un séparateur
        var pattern = /[^A-Za-z0-9àâçèéêîôùû\']/
        tokens = value.split(pattern).filter(function(token) {
          // Retire les éventuelles chaînes vides
          return token;
        }).map(function(token) {
          return token.toLocaleLowerCase();
        });
      } else {
        tokens = [value];
      }

      var terms =  {
        terms: {}
      };
      terms.terms[fieldBinding.term] = tokens;

      this._esq.query('body', 'query', 'bool', ['filter'],  terms);
    }
    return this;
  }

  must_not(fieldName, value) {
    var fieldBinding = this._bindings[fieldName];

    if (value) {
      var tokens = [value];
      
      var terms =  {
        terms: {}
      };
      terms.terms[fieldBinding.term] = tokens;

      this._esq.query('body', 'query', 'bool', ['must_not'],  terms);
    }

    return this;
  }

  sort(signedFields) {
    if (signedFields) {
      this._esq.query('body', 'sort', signedFields.map(function(signedField) {
        var order, field;

        if (signedField.slice(0, 1) === '-'){
          order = 'desc';
          field = signedField.slice(1, signedField.length);
        } else {
          order = 'asc';
          field = signedField;
        }

        var result = {};
        result[this._bindings[field].sort] = {order: order};

        return result;
      }, this));
    }
    return this;
  }


  build() {
    return this._esq.getQuery();
  }
}

module.exports = ParamsBuilder;
