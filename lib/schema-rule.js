const equal = require('deep-equal');


class SchemaRule {

  static isRule(rule) {
    let keys = Object.keys(rule);

    if (keys.length > 2) { return false; }

    for (let i = 0; i < keys.length; i += 1) {
      if (SchemaRule.ruleProps.indexOf(keys[i]) === -1) { return false; }
    }

    if (typeof rule.type !== 'function') { return false; }
    if (
      rule.match !== undefined &&
      typeof rule.match !== 'object' && typeof rule.match !== 'function'
    ) { return false; }

    if (typeof rule.match === 'object') {
      keys = Object.keys(rule.match);
      if (keys.length > SchemaRule.matchProps.length) { return false; }
      for (let i = 0; i < keys.length; i += 1) {
        if (SchemaRule.matchProps.indexOf(keys[i]) === -1) { return false; }
      }
    }
    return true;
  }

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

  constructor(rule) {
    if (typeof rule === 'function') { rule = { type: rule }; }

    if (rule === null || typeof rule !== 'object') { throw new Error('rule must be an object'); }
    if (typeof rule.type !== 'function') { throw new Error('rule.type must be a constructor'); }
    if (
      rule.match !== undefined &&
      typeof rule.match !== 'function' &&
      (typeof rule.match !== 'object' || rule.match.constructor !== Object) &&
      (typeof rule.match !== 'object' || rule.match.constructor !== RegExp)
    ) { throw new Error('rule.type must be a constructor, regular expression, or object'); }

    if (rule.match && typeof rule.match !== 'function') {
      rule.match = this._processMatchConditions(rule.match);
    }
    this.isAsync = rule.match ? rule.match.length > 1 : false;
    this.type    = rule.type;
    if (rule.match) { this.match = rule.match; }
  }

  validate(val, ctx, cb) {
    if (typeof ctx === 'function') {
      cb  = ctx;
      ctx = null;
    }
    cb || (cb = () => {});

    if (SchemaRule.types === null) {
      throw new Error(
        'There are no registered types. Has merlin-schema been correctly loaded?'
      );
    }
    if (typeof cb !== 'function') { return cb(new Error('cb must be a function')); }
    if (ctx && (typeof ctx !== 'function' || typeof ctx !== 'object')) {
      return cb(new Error('ctx must be a function or object'));
    }

    if (val !== undefined && val !== null) {
      const type = SchemaRule.getType(this.type);
      if (!type) {
        return cb(new Error('Rule is of unsupported type'));
      }
      if (!type.validate(val)) {
        return cb(new Error(`Must be an instance of ${type.name}`));
      }
    }

    if (this.match) {
      if (this.match.length > 1) {
        this.match.call(ctx, val, cb);
      } else {
        cb(this.match.call(ctx, val));
      }
    } else { cb(null); }
  }

  _processMatchConditions(match) {
    if (match === null || typeof match !== 'object') { throw new Error('match must be an object'); }

    const validators = [];

    if (match.constructor === RegExp) {
      return function(val) {
        if (!match.test(val)) { return new Error(`Must match expression ${match}`); }
      };
    }

    if (match.exists !== undefined) {
      if (typeof match.exists !== 'boolean') { throw new Error('match.exists must be a boolean'); }
      validators.push((val) => {
        if (val === undefined) { return new Error('Must exist'); }
      });
    }

    if (match.not !== undefined) {
      validators.push((val) => {
        if (equal(val, match.not)) { return new Error(`Must not equal ${match.not}`); }
      });
    }

    if (match.lt !== undefined) {
      if (typeof match.lt !== 'number' && typeof match.lt !== 'string') {
        throw new Error('match.lt must be a number or string');
      }
      validators.push((val) => {
        if (val >= match.lt) { return new Error(`Must be less than than ${match.lt}`); }
      });
    }

    if (match.gt !== undefined) {
      if (typeof match.gt !== 'number' && typeof match.gt !== 'string') {
        throw new Error('match.gt must be a number or string');
      }
      validators.push((val) => {
        if (val <= match.gt) { return new Error(`Must be greater than ${match.gt}`); }
      });
    }

    if (match.min !== undefined) {
      if (typeof match.min !== 'number') { throw new Error('match.min must be a number'); }
      validators.push((val) => {
        if (val === null || val === undefined || val.length < match.min) {
          return new Error(`Must be greater than ${match.min} chars in length`);
        }
      });
    }

    if (match.max !== undefined) {
      if (typeof match.max !== 'number') { throw new Error('match.max must be a number'); }
      validators.push((val) => {
        if (val === null || val === undefined || val.length > match.max) {
          return new Error(`Must be less than ${match.max} chars in length`);
        }
      });
    }

    if (match.length !== undefined) {
      if (typeof match.length !== 'number') { throw new Error('match.length must be a number'); }
      validators.push((val) => {
        if (val === null || val === undefined || val.length !== match.length) {
          return new Error(`Must be ${match.length} chars in length`);
        }
      });
    }

    if (match.in !== undefined) {
      if (typeof match.in !== 'object' || typeof match.in.length !== 'number') {
        throw new Error('match.in must be an array');
      }
      validators.push((val) => {
        let found = false;
        for (let i = 0; i < match.in.length; i += 1) {
          if (equal(match.in[i], val)) {
            found = true;
            break;
          }
        }
        if (!found) {
          return new Error(
            `Must match one of the following values: '${match.in.join('\', \'')}'`
          );
        }
      });
    }

    if (match.notIn !== undefined) {
      if (typeof match.notIn !== 'object' || typeof match.notIn.length !== 'number') {
        throw new Error('match.notIn must be an array');
      }
      validators.push((val) => {
        for (let i = 0; i < match.notIn.length; i += 1) {
          if (equal(match.notIn[i], val)) {
            return new Error(
              `Must not match any of the following values: '${match.notIn.join('\', \'')}'`
            );
          }
        }
      });
    }

    return (val) => {
      for (let i = 0; i < validators.length; i += 1) {
        const err = validators[i](val);
        if (err) { return err; }
      }
    };
  }
}

SchemaRule.types      = [];
SchemaRule.ruleProps  = ['type', 'match'];
SchemaRule.matchProps = ['not', 'exists', 'lt', 'gt', 'min', 'max', 'length', 'in', 'notIn'];


module.exports = SchemaRule;
