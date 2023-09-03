import { main } from '../../bin/main.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';
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
      cwd: jasmine.createSpy('process.cwd').and.returnValue('/cwd'),
      env: [],
      argv: [],
      stdout: {
        write: jasmine.createSpy('process.stdout.write').and.callFake((str) => { mocks.stdout += str; })
      },
      stderr: {
        write: jasmine.createSpy('process.stderr.write').and.callFake((str) => { mocks.stderr += str; })
      },
      stdin: {
        setEncoding: jasmine.createSpy('process.stdin.setEncoding'),
        on: jasmine.createSpy('process.stdin.on').and.callFake((method, func) => {
          mocks.stdin[method] = func;
        }),
        resume: jasmine.createSpy('process.stdin.resume')
      },
      exit: jasmine.createSpy('process.exit').and.callFake((code) => { mocks.code = code; })
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

    await expectAsync(mocks.stdout).toEqualHtml(stdout);
    expect(mocks.stderr).toEqual(stderr);
    expect(mocks.code).toBe(code);
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
      stderr: jasmine.stringContaining(`Cannot load config file '${fixturePath('does-not-exist.js')}'`),
      code: 1
    }));
  });
});
