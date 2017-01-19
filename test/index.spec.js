const assert       = require('assert');
const merlinSchema = require('../');


describe('merlinSchema.create(ruleDefs) -> schema', () => {

  it('Throws when incorrect arguments a given', () => {
    assert.throws(() => merlinSchema.create());
    assert.throws(() => merlinSchema.create(null));
    assert.throws(() => merlinSchema.create(1));
    assert.throws(() => merlinSchema.create('s'));
    assert.throws(() => merlinSchema.create({ field: { invalid: true } }));
  });

  it('Returns a schema instance', () => {
    const schema = merlinSchema.create({});
    assert.ok(schema instanceof merlinSchema.Schema);
  });
});
