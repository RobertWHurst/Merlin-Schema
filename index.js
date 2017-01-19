
const Schema      = require('./lib/schema');
const SchemaRule  = require('./lib/schema-rule');
const SchemaError = require('./lib/schema-error');

// load up the schema types
require('./lib/types');

exports.create = rules => new Schema(rules);
exports.validate = (rules, record, cb) => new Schema(rules).validate(record, cb);
exports.addType = (Class, opts) => Schema.addType(Class, opts);

exports.Schema      = Schema;
exports.SchemaRule  = SchemaRule;
exports.SchemaError = SchemaError;
