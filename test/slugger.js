/**
 * Slugger
 */
function Slugger () {
  this.seen = {};
}

/**
 * Generate a unique slug.
 */
Slugger.prototype.slug = function (raw) {
  var slug = raw.toLowerCase().replace(/[^\w]+/g, '-');
  var count = this.seen.hasOwnProperty(slug) ? this.seen[slug] + 1 : 0;
  this.seen[slug] = count;

  if (count > 0) {
    slug = slug + '-' + count;
  }

  return slug;
};

module.exports = Slugger;
