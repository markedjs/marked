export default {
  tokenizer: {
    codespan(src) {
      const match = /^`([^`]+)`/.exec(src);
      if (match) {
        return {
          type: 'codespan',
          raw: match[0],
          text: match[1].toUpperCase(),
        };
      }
      return false;
    },
  },
};
