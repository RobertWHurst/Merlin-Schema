const SchemaRule  = require('./schema-rule');
const SchemaError = require('./schema-error');


class Schema {

  static getType(Class) {
    if (typeof Class !== 'function' && typeof Class !== 'string') {
      throw new Error('Class must be a constructor or string');
    }
    for (let i = 0; i < this.types.length; i += 1) {
      if (typeof Class === 'string') {
        return this.types[i].name === Class;
      } else if (this.types[i].Class === Class) {
        return this.types[i];
      }
    }
    return null;
  }

  static addType(Class, opts) {
    if (typeof Class !== 'function') { throw new Error('Class must be a constructor'); }
    if (this.getType(Class)) { throw new Error('Class is already registered'); }
    if (opts === null || typeof opts !== 'object') { throw new Error('opts must be an object'); }
    if (typeof opts.name !== 'string') { throw new Error('opts.name must be a string'); }
    if (typeof opts.validate !== 'function') {
      throw new Error('opts.validate must be a function');
    }

    const type = {
      Class,
      name    : opts.name,
      validate: opts.validate,
    };

    this.types.push(type);

    return type;
  }

  constructor(rules) {
    if (rules === null || typeof rules !== 'object') { throw new Error('rules must be an object'); }
    this.isAsync = false;
    this.error   = null;
    this.opts    = this._extractOpts(rules);
    this.rules   = this._createRules(rules);
  }

  validate(obj, paths, ctx, _cb) {
    if (typeof paths === 'function') {
      _cb   = paths;
      paths = null;
    }
    if (typeof ctx === 'function') {
      _cb   = ctx;
      ctx   = paths;
      paths = null;
    }

    if (_cb === undefined && this.isAsync) {
      throw new Error('Callback required for async validation');
    }

    let returnValue;
    const cb = (err, _returnValue) => {
      this.error  = err;
      returnValue = _returnValue;
      _cb && _cb(err, _returnValue);
    };

    if (paths) {
      if (typeof paths !== 'object' || typeof paths.length !== 'number') {
        return cb(new Error('paths must be an array'));
      }
      for (let i = 0; i < paths.length; i += 1) {
        if (typeof paths[i] !== 'string') {
          return cb(new Error('paths must only contain strings'));
        }
      }
    }
    if (ctx && (typeof ctx !== 'function' || typeof ctx !== 'object')) {
      return cb(new Error('ctx must be a function or object'));
    }

    if (obj === null || typeof obj !== 'object') { return cb(new Error('must be an object')); }

    const rec = (path, rule, val, cb) => {

      if (paths && paths.indexOf(path.join('.')) === -1) { return cb(null); }

      if (rule instanceof SchemaRule) {
        rule.validate(val, ctx, cb);
      } else {
        let errors = null;
        let j      = 0;

        if (typeof rule.length === 'number') {

          if (val === null || typeof val !== 'object' || typeof val.length !== 'number') {
            return cb(new Error('Must be an instance of Array'));
          }

          if (val.length < 1) { return cb(null); }

          rule = rule[0];

          for (let i = 0; i < val.length; i += 1) {
            // eslint-disable-next-line no-loop-func
            rec(path.concat(i), rule, val[i], (err) => {
              if (err) {
                errors    = errors || [];
                errors[j] = err;
              }
              j += 1;
              if (j === val.length) { cb(errors); }
            });
          }

        } else {

          if (val === null || typeof val !== 'object') {
            return cb(new Error('Must be an instance of Object'));
          }

          const rProps = Object.keys(rule);

          if (this.opts.exclusive) {
            for (const prop in val) {
              if (val.hasOwnProperty(prop) && rProps.indexOf(prop) === -1) {
                errors = errors || {};
                errors[prop] = new Error(`${path.concat(prop).join('.')} is not an allowed path`);
              }
            }
            if (errors) { return cb(errors); }
          }

          if (this.opts.inclusive) {
            for (const rProp of rProps) {
              if (val[rProp] === undefined) {
                errors = errors || {};
                errors[rProp] = new Error(`${path.concat(rProp).join('.')} must exist`);
              }
            }
            if (errors) { return cb(errors); }
          }

          if (rProps.length < 1) { return cb(null); }

          for (const rProp of rProps) {
            // eslint-disable-next-line no-loop-func
            rec(path.concat(rProp), rule[rProp], val[rProp], (err) => {
              if (err) {
                errors        = errors || {};
                errors[rProp] = err;
              }
              j += 1;
              if (j === rProps.length) { cb(errors); }
            });
          }
        }
      }
    };

    rec([], this.rules, obj, (errors) => {
      if (errors) { return cb(new SchemaError(errors)); }
      cb(null);
    });

    if (returnValue !== undefined) {
      return returnValue;
    }
  }

  _createRules(rules) {
    if (typeof rules !== 'object') { throw new Error('Rules must be an object'); }

    const rec = (rules) => {
      const schema = typeof rules.length === 'number' ? [] : {};

      for (const prop in rules) {

        if (typeof rules[prop] === 'function') {
          rules[prop] = { type: rules[prop] };
        }

        if (rules[prop] === null || typeof rules[prop] !== 'object') {
          throw new Error('each rule must be an object or constructor');
        }

        if (rules[prop] instanceof SchemaRule || SchemaRule.isRule(rules[prop])) {
          if (!(rules[prop] instanceof SchemaRule)) {
            rules[prop] = new SchemaRule(rules[prop]);
          }
          if (!this.isAsync && rules[prop].isAsync) { this.isAsync = true; }
          schema[prop] = rules[prop];
        } else {
          schema[prop] = rec(rules[prop]);
        }
      }

      return schema;
    };

    return rec(rules);
  }

  _extractOpts(rules) {
    const opts = {};
    if (rules.$inclusive) {
      if (typeof rules.$inclusive !== 'boolean') {
        throw new Error('rules.$inclusive must be a boolean');
      }
      opts.inclusive = true;
      delete rules.$inclusive;
    }
    if (rules.$exclusive) {
      if (typeof rules.$exclusive !== 'boolean') {
        throw new Error('rules.$exclusive must be a boolean');
      }
      opts.exclusive = true;
      delete rules.$exclusive;
    }
    if (rules.$script) {
      if (typeof rules.$script !== 'boolean') {
        throw new Error('rules.$script must be a boolean');
      }
      opts.exclusive = true;
      opts.inclusive = true;
      delete rules.$strict;
    }
    return opts;
  }
}

Schema.types       = [];
SchemaRule.types   = Schema.types;
SchemaRule.getType = Schema.getType;
SchemaRule.addType = Schema.addType;


module.exports = Schema;
