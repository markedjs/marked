const marked = require('../');
const version = require('../package.json').version;
const name = 'Marked.js';

module.exports = (req, res) => {
	if (req.method !== 'GET') {
		return res.status(405).json({
        error: {
          code: 'method_not_allowed',
          message: 'Only GET requests are supported for this endpoint.',
        }
      });
	}
	const { text = '' } = req.query;
	const html = marked(text);
  res.json({ name, version, html });
}
