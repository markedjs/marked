/**
 * Slugger
 */
function Slugger () {
  this.seen = {};
}

/**
 * Generate a unique slug.
 */
Slugger.prototype.slug = function (value) {
  var slug = value
    .toLowerCase()
    .trim()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    .replace(/\s/g, '-');

  var count = this.seen.hasOwnProperty(slug) ? this.seen[slug] + 1 : 0;
  this.seen[slug] = count;

  if (count > 0) {
    slug = slug + '-' + count;
  }

  return slug;
};

module.exports = Slugger;
