 /**
 * Slugger generates header id
 *
 * such as h1, h2,... h6
 */

class Slugger {
  constructor() {
    this.seen = {}
  }

  slug(value) {
    let slug = value
      .toLowerCase()
      .trim()
      .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
      .replace(/\s/g, '-');

    if (this.seen[slug]) {
      var originalSlug = slug;
      do {
        this.seen[originalSlug]++;
        slug = originalSlug + '-' + this.seen[originalSlug];
      } while (this.seen[slug]);
    }

    this.seen[slug] = 0;

    return slug;
  }
}

export default Slugger
