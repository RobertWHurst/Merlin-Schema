const Schema = require('./schema');


Schema.addType(String, {
  name    : 'String',
  validate: val => typeof val === 'string',
});

Schema.addType(Number, {
  name    : 'Number',
  validate: val => typeof val === 'number',
});

Schema.addType(Boolean, {
  name    : 'Boolean',
  validate: val => typeof val === 'boolean',
});

Schema.addType(Array, {
  name    : 'Array',
  validate: val =>
    val !== null && typeof val === 'object' &&
    val.constructor === Array,
});

Schema.addType(Object, {
  name    : 'Object',
  validate: val =>
    val !== null && typeof val === 'object' &&
    val.constructor === Object,
});

Schema.addType(Date, {
  name    : 'Date',
  validate: val =>
    val !== null && typeof val === 'object' &&
    val.constructor === Date,
});

Schema.addType(RegExp, {
  name    : 'RegExp',
  validate: val =>
    val !== null && typeof val === 'object' &&
    val.constructor === RegExp,
});

Schema.addType(Buffer, {
  name    : 'Buffer',
  validate: val =>
    val !== null && typeof val === 'object' &&
    val.constructor === Buffer,
});
