module.exports = async() => {
  const { setImmediate } = await import('node:timers/promises');
  await setImmediate();
  throw new Error('Async config failed');
};
