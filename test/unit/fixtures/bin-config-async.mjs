import { setImmediate } from 'node:timers/promises';

export default async marked => {
  await setImmediate();
  marked.use({ breaks: true });
};
