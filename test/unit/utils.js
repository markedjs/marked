export async function timeout(ms = 1) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
