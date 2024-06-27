import { FuzzedDataProvider } from '@jazzer.js/core';
import { marked } from '../lib/marked.esm.js';

/**
 * @param { Buffer } fuzzerInputData
 */
export function fuzz(fuzzerInputData) {
  const data = new FuzzedDataProvider(fuzzerInputData);

  const [isInline, gfm, breaks, pedantic] = data.consumeBooleans(4);
  const chosenFunction = isInline ? marked.parseInline : marked.parse;

  const options = {
    gfm,
    breaks,
    pedantic
  };

  const start = process.hrtime();
  const result = chosenFunction(data.consumeRemainingAsString(), options);
  const [seconds, nanoseconds] = process.hrtime(start);

  const ms = seconds * 1000 + nanoseconds * 1e-6 > 1000;
  if (ms > 1000) {
    throw Error(`Marked.js conversion for (${result}) took ${ms}ms (>1000ms)`);
  }
}
