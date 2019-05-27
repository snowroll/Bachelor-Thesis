'use strict';

const expect = require('chai').expect;

const deobfuscator = require('../');
const sample = require('./cases').sample;
const simplify = file => deobfuscator.clean(sample(file));

describe('jsobfuscate', () => {
  it('should evaluate literals', done => {
    expect(simplify('jsobfuscator.com')).to.be.not.empty;
    done();
  });
});

describe('expression', () => {
  it('should simplify expressions', done => {
    expect(simplify('expressions')).to.be.not.empty;
    done();
  });

  it('should evaluate member method', done => {
    expect(simplify('functions')).to.be.not.empty;
    done();
  })

  it('should not convert unicode to identifier', done => {
    const UNICODE_MEMBER = `var a = b["\u03a6\u0394\u0391\u0393\u03a1\u0398\u03a5\u0394\u03a1"]`
    const EXPECTED = `var a = b['ΦΔΑΓΡΘΥΔΡ'];`
    const cleaned = deobfuscator.clean(UNICODE_MEMBER)
    expect(cleaned).to.equals(EXPECTED)
    done()
  })
});