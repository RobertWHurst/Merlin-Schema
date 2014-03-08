
var Schema = require('./lib/schema');
var SchemaRule = require('./lib/schema-rule');
var SchemaError = require('./lib/schema-error');

// load up the schema types
require('./lib/types');

exports.create = function(rules) {
  return new Schema(rules);
};
exports.addType = function(Class, opts) {
  return Schema.addType(Class, opts);
};

exports.Schema = Schema;
exports.SchemaRule = SchemaRule;
exports.SchemaError = SchemaError;
