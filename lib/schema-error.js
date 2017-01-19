

class SchemaError extends TypeError {
  constructor(errors) {
    super();
    this.errors = this._unwrapErrors(errors);
    this.mesage = this._createMessage(errors);
  }

  valueOf() {
    return this.errors;
  }

  toJSON() {
    return this.errors;
  }

  toString() {
    return JSON.stringify(this);
  }

  _unwrapErrors(errors) {
    const rec = (errors) => {
      for (const prop in errors) {
        if (
          errors.hasOwnProperty(prop) &&
          errors[prop] !== null &&
          typeof errors[prop] === 'object'
        ) {
          if (typeof errors[prop].message === 'string') {
            errors[prop] = errors[prop].message;
          } else {
            rec(errors[prop]);
          }
        }
      }
    };
    rec(errors);
    return errors;
  }

  _createMessage(errors) {
    const errMsgs = [];
    const rec = (path, errors) => {
      for (const prop in errors) {
        if (errors.hasOwnProperty(prop)) {
          const subPath = path ? `${path}.${prop}` : prop;
          if (typeof errors[prop] === 'object') {
            rec(subPath, errors[prop]);
          } else {
            errMsgs.push(`\t${subPath}: ${errors[prop]}`);
          }
        }
      }
    };
    rec('', errors);
    return `Schema Error:\n${errMsgs.join('\n')}`;
  }
}


module.exports = SchemaError;
