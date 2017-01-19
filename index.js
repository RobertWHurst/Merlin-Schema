
const Schema      = require('./lib/schema');
const SchemaRule  = require('./lib/schema-rule');
const SchemaError = require('./lib/schema-error');

require('./lib/types');

exports.create  = rules => new Schema(rules);
exports.addType = (Class, opts) => Schema.addType(Class, opts);

exports.error = null;
exports.validate = (rules, ...args) => {
  const schema = new Schema(rules);
  schema.validate(...args);
  this.error = schema.error;
};

exports.Schema      = Schema;
exports.SchemaRule  = SchemaRule;
exports.SchemaError = SchemaError;
