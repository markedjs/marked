import { marked } from '../src/marked.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const version = require('../package.json').version;
const name = 'Marked';

export default function dingus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: {
        code: 'method_not_allowed',
        message: 'Only GET requests are supported for this endpoint.'
      }
    });
  }
  const { text = '' } = req.query;
  const html = marked(text);
  res.json({ name, version, html });
}
