export class Hooks {
  static passThroughHooks = new Set([
    'preprocess',
    'postprocess'
  ]);

  /**
   * Process markdown before marked
   */
  preprocess(markdown) {
    return markdown;
  }

  /**
   * Process HTML after marked is finished
   */
  postprocess(html) {
    return html;
  }
}
