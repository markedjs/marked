import { main } from '../../bin/main.js';
import { htmlIsEqual } from '@markedjs/testutils';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createMocks() {
  const mocks = {
    stdout: '',
    stderr: '',
    code: null,
    stdin: {
      data: null,
      error: null,
      end: null
    },
    process: {
      cwd: mock.fn(() => '/cwd'),
      env: [],
      argv: [],
      stdout: {
        write: mock.fn((str) => { mocks.stdout += str; })
      },
      stderr: {
        write: mock.fn((str) => { mocks.stderr += str; })
      },
      stdin: {
        setEncoding: mock.fn(),
        on: mock.fn((method, func) => {
          mocks.stdin[method] = func;
        }),
        resume: mock.fn
      },
      exit: mock.fn((code) => { mocks.code = code; })
    }
  };

  return mocks;
}

function testInput({ args = [], stdin = '', stdinError = '', stdout = '', stderr = '', code = 0 } = {}) {
  return async() => {
    const mocks = createMocks();
    mocks.process.argv = args;
    const mainPromise = main(mocks.process);
    if (typeof mocks.stdin.end === 'function') {
      if (stdin) {
        mocks.stdin.data(stdin);
      }
      if (stdinError) {
        mocks.stdin.error(stdinError);
      }
      mocks.stdin.end();
    }
    await mainPromise;

    assert.ok(await htmlIsEqual(mocks.stdout, stdout));
    assert.strictEqual(mocks.stderr, stderr);
    assert.strictEqual(mocks.code, code);
  };
}

function fixturePath(filePath) {
  return resolve(__dirname, './fixtures', filePath);
}

describe('bin/marked', () => {
  describe('string', () => {
    it('-s', testInput({
      args: ['-s', '# test'],
      stdout: '<h1>test</h1>'
    }));

    it('--string', testInput({
      args: ['--string', '# test'],
      stdout: '<h1>test</h1>'
    }));
  });

  describe('config', () => {
    it('-c', testInput({
      args: ['-c', fixturePath('bin-config.js'), '-s', 'line1\nline2'],
      stdout: '<p>line1<br>line2</p>'
    }));

    it('--config', testInput({
      args: ['--config', fixturePath('bin-config.js'), '-s', 'line1\nline2'],
      stdout: '<p>line1<br>line2</p>'
    }));

    it('not found', testInput({
      args: ['--config', fixturePath('does-not-exist.js'), '-s', 'line1\nline2'],
      stderr: `Error: Cannot load config file '${fixturePath('does-not-exist.js')}'`,
      code: 1
    }));
  });
});
