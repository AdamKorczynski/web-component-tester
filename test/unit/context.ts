/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import {Context} from '../../runner/context';
import {Plugin} from '../../runner/plugin';

const expect = chai.expect;
chai.use(sinonChai);

describe('Context', () => {

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('.plugins', () => {

    it('excludes plugins with a falsy config', async() => {
      const context = new Context(<any>{plugins: {local: false, sauce: {}}});
      const stub = sandbox.stub(Plugin, 'get', (name: string) => {
        return Promise.resolve(name);
      });

      const plugins = await context.plugins();
      expect(stub).to.have.been.calledOnce;
      expect(stub).to.have.been.calledWith('sauce');
      expect(plugins).to.have.members(['sauce']);
    });

    it('excludes plugins disabled: true', async() => {
      const context =
          new Context(<any>{plugins: {local: {}, sauce: {disabled: true}}});
      const stub = sandbox.stub(Plugin, 'get', (name: string) => {
        return Promise.resolve(name);
      });

      const plugins = await context.plugins();
      expect(stub).to.have.been.calledOnce;
      expect(stub).to.have.been.calledWith('local');
      expect(plugins).to.have.members(['local']);
    });

    describe('hooks handlers', () => {
      it('invoke hook with empty arguments', async() => {
        const spy = sinon.spy();
        const context = new Context();
        context.hook('foo', async function() {
          expect(arguments.length).to.eq(0);
          spy();
        });

        await context.emitHook('foo');

        expect(spy.called).to.eq(true);
      });

      it('accept single argument', async() => {
        const context = new Context();
        context.hook('foo', async function(arg1: any) {
          expect(arguments.length).to.eq(1);
          expect(arg1).to.eq('one');
        });

        await context.emitHook('foo', 'one');
      });

      it('pass additional arguments through', async() => {
        const context = new Context();
        context.hook('foo', async function(arg1: any, arg2: any) {
          expect(arguments.length).to.eq(2);
          expect(arg1).to.eq('one');
          expect(arg2).to.eq(2);
        });

        await context.emitHook('foo', 'one', 2);
      });

      it('halts on error', async() => {
        const context = new Context();
        context.hook('bar', async function() {
          throw 'nope';
        });

        // Tests the promise form of emitHook.
        try {
          await context.emitHook('bar');
          throw new Error('emitHook should have thrown');
        } catch (error) {
          expect(error).to.eq('nope');
        }
      });
    });
  });
});
