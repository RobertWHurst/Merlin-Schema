/* eslint-disable max-len */
const assert     = require('assert');
const Schema     = require('../lib/schema');
const SchemaRule = require('../').SchemaRule;


describe('new Schema(ruleDefs) -> schema', () => {

  it('Throws when incorrect arguments a given', () => {
    assert.throws(() => new Schema());
    assert.throws(() => new Schema(null));
    assert.throws(() => new Schema(1));
    assert.throws(() => new Schema('s'));
    assert.throws(() => new Schema({ field: { invalid: true } }));
  });

  it('Accepts an object where path values are type constructors', () => {
    const schema = new Schema({ field: String });
    assert.equal(typeof schema.rules.field, 'object');
    assert.equal(schema.rules.field.constructor, SchemaRule);
    assert.equal(schema.rules.field.type, String);
  });

  it('Accepts an object where path values are ruleDef objects containing just a type', () => {
    const schema = new Schema({ field: { type: String } });
    assert.equal(typeof schema.rules.field, 'object');
    assert.equal(schema.rules.field.constructor, SchemaRule);
    assert.equal(schema.rules.field.type, String);
  });

  it('Accepts an object where path values are ruleDef objects containing a type and match regex', () => {
    const pattern = /pattern/;
    const schema = new Schema({ field: { type: String, match: pattern } });
    assert.equal(typeof schema.rules.field, 'object');
    assert.equal(schema.rules.field.constructor, SchemaRule);
    assert.equal(schema.rules.field.type, String);
    assert.equal(typeof schema.rules.field.match, 'function');
  });


  it('Accepts an object where path values are ruleDef objects containing a type and match function', () => {
    const fn = () => {};
    const schema = new Schema({ field: { type: String, match: fn } });
    assert.equal(typeof schema.rules.field, 'object');
    assert.equal(schema.rules.field.constructor, SchemaRule);
    assert.equal(schema.rules.field.type, String);
    assert.equal(schema.rules.field.match, fn);
  });

  describe('#validate(record, [paths], [ctx], [cb]) -> [isValid]', () => {

    it('does not throw in any given data', () => {
      const schema = new Schema({ field: String });
      schema.validate();
      schema.validate({});
      schema.validate(null);
      schema.validate(1);
      schema.validate('s');
      schema.validate(true);
    });

    it('sets schema.error if the record is not an object', () => {
      const schema = new Schema({ field: String });

      schema.validate(null);
      assert.equal(schema.error.message, 'must be an object');

      schema.validate(1);
      assert.equal(schema.error.message, 'must be an object');

      schema.validate('s');
      assert.equal(schema.error.message, 'must be an object');

      schema.validate(false);
      assert.equal(schema.error.message, 'must be an object');

      schema.validate({});
      assert.equal(schema.error, null);
    });

    it('calls back with an error if the record is not an object', () => {
      const schema = new Schema({ field: String });

      schema.validate(null, (err) => {
        assert.equal(err.message, 'must be an object');
      });
      schema.validate(1, (err) => {
        assert.equal(err.message, 'must be an object');
      });
      schema.validate('s', (err) => {
        assert.equal(err.message, 'must be an object');
      });
      schema.validate(false, (err) => {
        assert.equal(err.message, 'must be an object');
      });
      schema.validate({}, (err) => {
        assert.ifError(err);
      });
    });

    it('correctly validates test cases', () => {
      const tests = [
        { schema: { field: String }, obj: {}, expected: null },
        { schema: { field: Number }, obj: {}, expected: null },
        { schema: { field: Boolean }, obj: {}, expected: null },
        { schema: { field: Array }, obj: {}, expected: null },
        { schema: { field: Object }, obj: {}, expected: null },
        { schema: { field: Date }, obj: {}, expected: null },
        { schema: { field: RegExp }, obj: {}, expected: null },
        { schema: { field: Buffer }, obj: {}, expected: null },

        { schema: { field: { type: String, match: /pattern/ } }, obj: { field: '' }, expected: { field: 'Must match expression /pattern/' } },
        { schema: { field: { type: String, match: /pattern/ } }, obj: { field: 'pattern' }, expected: null },
        { schema: { field: { type: String, match: { lt: 'b' } } }, obj: { field: 'c' }, expected: { field: 'Must be less than than b' } },
        { schema: { field: { type: String, match: { lt: 'b' } } }, obj: { field: 'a' }, expected: null },
        { schema: { field: { type: String, match: { gt: 'b' } } }, obj: { field: 'a' }, expected: { field: 'Must be greater than b' } },
        { schema: { field: { type: String, match: { gt: 'b' } } }, obj: { field: 'c' }, expected: null },
        { schema: { field: { type: String, match: { min: 2 } } }, obj: { field: 'a' }, expected: { field: 'Must be greater than 2 chars in length' } },
        { schema: { field: { type: String, match: { min: 2 } } }, obj: { field: 'ab' }, expected: null },
        { schema: { field: { type: String, match: { max: 2 } } }, obj: { field: 'abc' }, expected: { field: 'Must be less than 2 chars in length' } },
        { schema: { field: { type: String, match: { max: 2 } } }, obj: { field: 'ab' }, expected: null },
        { schema: { field: { type: String, match: { length: 2 } } }, obj: { field: 'a' }, expected: { field: 'Must be 2 chars in length' } },
        { schema: { field: { type: String, match: { length: 2 } } }, obj: { field: 'abc' }, expected: { field: 'Must be 2 chars in length' } },
        { schema: { field: { type: String, match: { length: 2 } } }, obj: { field: 'ab' }, expected: null },
        { schema: { field: { type: String, match: { in: ['a', 'b'] } } }, obj: { field: '' }, expected: { field: 'Must match one of the following values: \'a\', \'b\'' } },
        { schema: { field: { type: String, match: { in: ['a', 'b'] } } }, obj: { field: 'a' }, expected: null },
        { schema: { field: { type: String, match: { in: ['a', 'b'] } } }, obj: { field: 'b' }, expected: null },
        { schema: { field: { type: String, match: { notIn: ['a', 'b'] } } }, obj: { field: '' }, expected: null },
        { schema: { field: { type: String, match: { notIn: ['a', 'b'] } } }, obj: { field: 'a' }, expected: { field: 'Must not match any of the following values: \'a\', \'b\'' } },
        { schema: { field: { type: String, match: { notIn: ['a', 'b'] } } }, obj: { field: 'b' }, expected: { field: 'Must not match any of the following values: \'a\', \'b\'' } },
        { schema: { field: { type: String, match: { exists: true } } }, obj: {}, expected: { field: 'Must exist' } },
        { schema: { field: { type: String, match: { exists: true } } }, obj: { field: '' }, expected: null },
        { schema: { field: { type: String, match(val) { assert.equal(val, ''); return new Error('test err'); } } }, obj: { field: '' }, expected: { field: 'test err' } },
        { schema: { field: { type: String, match(val) { assert.equal(val, ''); } } }, obj: { field: '' }, expected: null },

        { schema: { field: { field: String } }, obj: {}, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: { field: String } }, obj: { field: '' }, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: { field: String } }, obj: { field: {} }, expected: null },
        { schema: { field: { field: { type: String, match: { exists: true } } } }, obj: { field: {} }, expected: { field: { field: 'Must exist' } } },
        { schema: { field: { field: String } }, obj: { field: { field: 1 } }, expected: { field: { field: 'Must be an instance of String' } } },
        { schema: { field: { field: String } }, obj: { field: { field: '' } }, expected: null },
        { schema: { field: [{ field: String }] }, obj: {}, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: [{ field: String }] }, obj: { field: {} }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: [{ field: String }] }, obj: { field: { field: '' } }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: [{ field: String }] }, obj: { field: [] }, expected: null },
        { schema: { field: [{ field: String }] }, obj: { field: [{ field: 1 }] }, expected: { field: [{ field: 'Must be an instance of String' }] } },
        { schema: { field: [{ field: String }] }, obj: { field: [{ field: '' }] }, expected: null },

        { schema: { field: String }, obj: { field: '' }, expected: null },
        { schema: { field: Number }, obj: { field: 1 }, expected: null },
        { schema: { field: Boolean }, obj: { field: true }, expected: null },
        { schema: { field: Array }, obj: { field: [] }, expected: null },
        { schema: { field: Object }, obj: { field: {} }, expected: null },
        { schema: { field: Date }, obj: { field: new Date() }, expected: null },
        { schema: { field: RegExp }, obj: { field: /pattern/ }, expected: null },
        { schema: { field: Buffer }, obj: { field: Buffer.from('') }, expected: null },

        { schema: { field: String }, obj: { field: 1 }, expected: { field: 'Must be an instance of String' } },
        { schema: { field: String }, obj: { field: true }, expected: { field: 'Must be an instance of String' } },
        { schema: { field: String }, obj: { field: [] }, expected: { field: 'Must be an instance of String' } },
        { schema: { field: String }, obj: { field: {} }, expected: { field: 'Must be an instance of String' } },
        { schema: { field: String }, obj: { field: new Date() }, expected: { field: 'Must be an instance of String' } },
        { schema: { field: String }, obj: { field: /pattern/ }, expected: { field: 'Must be an instance of String' } },
        { schema: { field: String }, obj: { field: Buffer.from('') }, expected: { field: 'Must be an instance of String' } },

        { schema: { field: Number }, obj: { field: '' }, expected: { field: 'Must be an instance of Number' } },
        { schema: { field: Number }, obj: { field: true }, expected: { field: 'Must be an instance of Number' } },
        { schema: { field: Number }, obj: { field: [] }, expected: { field: 'Must be an instance of Number' } },
        { schema: { field: Number }, obj: { field: {} }, expected: { field: 'Must be an instance of Number' } },
        { schema: { field: Number }, obj: { field: new Date() }, expected: { field: 'Must be an instance of Number' } },
        { schema: { field: Number }, obj: { field: /pattern/ }, expected: { field: 'Must be an instance of Number' } },
        { schema: { field: Number }, obj: { field: Buffer.from('') }, expected: { field: 'Must be an instance of Number' } },

        { schema: { field: Boolean }, obj: { field: '' }, expected: { field: 'Must be an instance of Boolean' } },
        { schema: { field: Boolean }, obj: { field: 1 }, expected: { field: 'Must be an instance of Boolean' } },
        { schema: { field: Boolean }, obj: { field: [] }, expected: { field: 'Must be an instance of Boolean' } },
        { schema: { field: Boolean }, obj: { field: {} }, expected: { field: 'Must be an instance of Boolean' } },
        { schema: { field: Boolean }, obj: { field: new Date() }, expected: { field: 'Must be an instance of Boolean' } },
        { schema: { field: Boolean }, obj: { field: /pattern/ }, expected: { field: 'Must be an instance of Boolean' } },
        { schema: { field: Boolean }, obj: { field: Buffer.from('') }, expected: { field: 'Must be an instance of Boolean' } },

        { schema: { field: Array }, obj: { field: '' }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: Array }, obj: { field: 1 }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: Array }, obj: { field: true }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: Array }, obj: { field: {} }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: Array }, obj: { field: new Date() }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: Array }, obj: { field: /pattern/ }, expected: { field: 'Must be an instance of Array' } },
        { schema: { field: Array }, obj: { field: Buffer.from('') }, expected: { field: 'Must be an instance of Array' } },

        { schema: { field: Object }, obj: { field: '' }, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: Object }, obj: { field: 1 }, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: Object }, obj: { field: true }, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: Object }, obj: { field: [] }, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: Object }, obj: { field: new Date() }, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: Object }, obj: { field: /pattern/ }, expected: { field: 'Must be an instance of Object' } },
        { schema: { field: Object }, obj: { field: Buffer.from('') }, expected: { field: 'Must be an instance of Object' } },

        { schema: { field: Date }, obj: { field: '' }, expected: { field: 'Must be an instance of Date' } },
        { schema: { field: Date }, obj: { field: 1 }, expected: { field: 'Must be an instance of Date' } },
        { schema: { field: Date }, obj: { field: true }, expected: { field: 'Must be an instance of Date' } },
        { schema: { field: Date }, obj: { field: [] }, expected: { field: 'Must be an instance of Date' } },
        { schema: { field: Date }, obj: { field: {} }, expected: { field: 'Must be an instance of Date' } },
        { schema: { field: Date }, obj: { field: /pattern/ }, expected: { field: 'Must be an instance of Date' } },
        { schema: { field: Date }, obj: { field: Buffer.from('') }, expected: { field: 'Must be an instance of Date' } },

        { schema: { field: RegExp }, obj: { field: '' }, expected: { field: 'Must be an instance of RegExp' } },
        { schema: { field: RegExp }, obj: { field: 1 }, expected: { field: 'Must be an instance of RegExp' } },
        { schema: { field: RegExp }, obj: { field: true }, expected: { field: 'Must be an instance of RegExp' } },
        { schema: { field: RegExp }, obj: { field: [] }, expected: { field: 'Must be an instance of RegExp' } },
        { schema: { field: RegExp }, obj: { field: {} }, expected: { field: 'Must be an instance of RegExp' } },
        { schema: { field: RegExp }, obj: { field: new Date() }, expected: { field: 'Must be an instance of RegExp' } },
        { schema: { field: RegExp }, obj: { field: Buffer.from('') }, expected: { field: 'Must be an instance of RegExp' } },

        { schema: { field: Buffer }, obj: { field: '' }, expected: { field: 'Must be an instance of Buffer' } },
        { schema: { field: Buffer }, obj: { field: 1 }, expected: { field: 'Must be an instance of Buffer' } },
        { schema: { field: Buffer }, obj: { field: true }, expected: { field: 'Must be an instance of Buffer' } },
        { schema: { field: Buffer }, obj: { field: [] }, expected: { field: 'Must be an instance of Buffer' } },
        { schema: { field: Buffer }, obj: { field: {} }, expected: { field: 'Must be an instance of Buffer' } },
        { schema: { field: Buffer }, obj: { field: new Date() }, expected: { field: 'Must be an instance of Buffer' } },
        { schema: { field: Buffer }, obj: { field: /pattern/ }, expected: { field: 'Must be an instance of Buffer' } },
      ];

      for (const test of tests) {
        const schema = new Schema(test.schema);
        // eslint-disable-next-line no-loop-func
        schema.validate(test.obj, (err) => {
          const testStr = JSON.stringify({ schema: test.schema, obj: test.obj });
          if (test.expected) {
            const expectStr = JSON.stringify(test.expected);
            assert.deepEqual(test.expected, err && err.errors, `Expected ${expectStr} on test case ${testStr}`);
          } else {
            assert.ifError(err, `Error ${err && err.message} on test case ${testStr}`);
          }
        });
      }
    });

    it('can perform async validations correctly', (done) => {
      const schema = new Schema({
        field: {
          type : String,
          match: (val, cb) => {
            assert.equal(val, '');
            setTimeout(() => {
              cb(new Error('test err'));
            }, 10);
          },
        },
      });
      schema.validate({ field: '' }, (err) => {
        assert.equal(err && err.errors && err.errors.field, 'test err');
        done();
      });
    });

    it('refuses to do async validations if validate was not given a callback', () => {
      const schema = new Schema({
        field: {
          type : String,
          match: (val, cb) => {
            assert.equal(val, '');
            setTimeout(() => {
              cb(new Error('test err'));
            }, 10);
          },
        },
      });
      assert.throws(() => schema.validate({ field: '' }));
    });
  });
});
