import { _defaults } from './defaults.ts';
import type { MarkedOptions } from './MarkedOptions.ts';

export class _Hooks {
  options: MarkedOptions;

  constructor(options?: MarkedOptions) {
    this.options = options || _defaults;
  }

  static passThroughHooks = new Set([
    'preprocess',
    'postprocess'
  ]);

  /**
   * Process markdown before marked
   */
  preprocess(markdown: string) {
    return markdown;
  }

  /**
   * Process HTML after marked is finished
   */
  postprocess(html: string | undefined) {
    return html;
  }
}
