import type { SluggerOptions } from './MarkedOptions.ts';

/**
 * Slugger generates header id
 */
export class _Slugger {
  seen: { [slugValue: string]: number };

  constructor() {
    this.seen = {};
  }

  serialize(value: string) {
    return value
      .toLowerCase()
      .trim()
      // remove html tags
      .replace(/<[!\/a-z].*?>/ig, '')
      // remove unwanted chars
      .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
      .replace(/\s/g, '-');
  }

  /**
   * Finds the next safe (unique) slug to use
   */
  getNextSafeSlug(originalSlug: string, isDryRun: boolean | undefined) {
    let slug = originalSlug;
    let occurenceAccumulator = 0;
    if (this.seen.hasOwnProperty(slug)) {
      occurenceAccumulator = this.seen[originalSlug];
      do {
        occurenceAccumulator++;
        slug = originalSlug + '-' + occurenceAccumulator;
      } while (this.seen.hasOwnProperty(slug));
    }
    if (!isDryRun) {
      this.seen[originalSlug] = occurenceAccumulator;
      this.seen[slug] = 0;
    }
    return slug;
  }

  /**
   * Convert string to unique id
   */
  slug(value: string, options: SluggerOptions = {}) {
    const slug = this.serialize(value);
    return this.getNextSafeSlug(slug, options.dryrun);
  }
}
