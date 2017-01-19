const assert     = require('assert');
const SchemaRule = require('../lib/schema-rule');


describe('new SchemaRule(ruleDef) -> schemaRule', () => {

  it('Throws when incorrect arguments a given', () => {
    assert.throws(() => new SchemaRule());
    assert.throws(() => new SchemaRule(null));
    assert.throws(() => new SchemaRule(1));
    assert.throws(() => new SchemaRule('s'));
    assert.throws(() => new SchemaRule(false));
    assert.throws(() => new SchemaRule({}));
    assert.throws(() => new SchemaRule({ type: null }));
    assert.throws(() => new SchemaRule({ type: 1 }));
    assert.throws(() => new SchemaRule({ type: 's' }));
    assert.throws(() => new SchemaRule({ type: false }));
    assert.throws(() => new SchemaRule({ type: {} }));
    assert.throws(() => new SchemaRule({ type: [] }));
    assert.throws(() => new SchemaRule({ type: String, match: null }));
    assert.throws(() => new SchemaRule({ type: String, match: 1 }));
    assert.throws(() => new SchemaRule({ type: String, match: 's' }));
    assert.throws(() => new SchemaRule({ type: String, match: [] }));
  });

  it('accepts a type constructor as ruleDef', () => {
    const schemaRule = new SchemaRule(String);
    assert.equal(schemaRule.type, String);
  });

  it('accepts a ruleDef with just a type', () => {
    const schemaRule = new SchemaRule({ type: String });
    assert.equal(schemaRule.type, String);
  });

  it('accepts a ruleDef with a type and match rules', () => {
    const schemaRule = new SchemaRule({ type: String, match: { exists: true } });
    assert.equal(schemaRule.type, String);
    assert.equal(typeof schemaRule.match, 'function');
  });


  describe('#validate(record, [cb]) -> [isValid]', () => {

    it('does not throw in any given data', () => {
      const schemaRule = new SchemaRule(String);
      schemaRule.validate();
      schemaRule.validate(null);
      schemaRule.validate(1);
      schemaRule.validate('s');
      schemaRule.validate(false);
      schemaRule.validate({ type: [] });
      schemaRule.validate({ type: String, match: null });
      schemaRule.validate({ type: String, match: 1 });
      schemaRule.validate({ type: String, match: 's' });
      schemaRule.validate({ type: String, match: [] });
      schemaRule.validate(String);
      schemaRule.validate({ type: String });
      schemaRule.validate({ type: String, match: {} });
    });
  });
});
