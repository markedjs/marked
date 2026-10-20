import { setImmediate } from 'node:timers/promises';

export default async function() {
  await setImmediate();
  throw new Error('Failed to load async configuration');
}
