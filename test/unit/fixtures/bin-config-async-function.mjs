import { setImmediate } from 'node:timers/promises';

export default async function(marked) {
  await setImmediate();
  marked.use({ breaks: true });
}
