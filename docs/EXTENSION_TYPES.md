# Extension Types in Marked.js

This document clarifies the different types of extensions in marked.js to help developers understand the API better.

## Two Types of Extensions

Marked.js has two distinct concepts that are both called "extensions" in the documentation, which can cause confusion:

### 1. MarkedExtensions (Configuration Objects)

**Type**: `MarkedExtension` interface  
**Usage**: Passed to `marked.use()` or `new Marked()`  
**Purpose**: Configuration objects that can contain various options and settings

```javascript
// MarkedExtension examples
marked.use({
  gfm: true,
  breaks: false,
  pedantic: false
});

marked.use({
  renderer: {
    heading(text, level) {
      return `<h${level}>${text}</h${level}>`;
    }
  }
});

marked.use({
  extensions: [/* SyntaxExtensions go here */]
});
```

### 2. SyntaxExtensions (Custom Parsing Logic)

**Type**: `SyntaxExtension` interface  
**Usage**: Objects inside the `extensions` array of a MarkedExtension  
**Purpose**: Define custom tokenizers and renderers for new syntax

```javascript
// SyntaxExtension example
const customExtension = {
  name: 'customBlock',
  level: 'block',
  start: (src) => src.match(/:::/)?.index,
  tokenizer(src) {
    const match = src.match(/^:::\s*(\w+)\s*\n([\s\S]*?)\n:::/);
    if (match) {
      return {
        type: 'customBlock',
        raw: match[0],
        name: match[1],
        content: match[2]
      };
    }
  },
  renderer(token) {
    return `<div class="custom-${token.name}">${token.content}</div>`;
  }
};

// Using the SyntaxExtension
marked.use({
  extensions: [customExtension] // This is a MarkedExtension with SyntaxExtensions
});
```

## API Signatures Clarified

### 1. `new Marked(extension, extension, extension)`
- Each `extension` parameter is a **MarkedExtension**
- Can contain any MarkedExtension options including `extensions` array

### 2. `marked.use(extension)`
- The `extension` parameter is a **MarkedExtension**
- Can contain any MarkedExtension options including `extensions` array

### 3. `marked.use({ extensions: [SyntaxExtensions] })`
- The outer object is a **MarkedExtension**
- The `extensions` property contains an array of **SyntaxExtensions**

## Clear Terminology

To avoid confusion, we recommend using these prefixes in documentation:

- **MarkedExtension**: Configuration objects for `marked.use()`
- **SyntaxExtension**: Custom parsing logic objects for the `extensions` array
- **Extension Options**: The `extensions` property within a MarkedExtension

## Examples of Clear Usage

```javascript
// MarkedExtension with various options
const markdownConfig = {
  gfm: true,
  breaks: false,
  renderer: {
    // custom renderer methods
  }
};

// MarkedExtension with SyntaxExtensions
const customSyntaxConfig = {
  extensions: [
    {
      name: 'alert',
      level: 'block',
      start: (src) => src.match(/^!!!\s/)?.index,
      tokenizer(src) {
        // custom tokenizer logic
      },
      renderer(token) {
        // custom renderer logic
      }
    }
  ]
};

// Using both
marked.use(markdownConfig);
marked.use(customSyntaxConfig);
```

## Migration from Previous Versions

When upgrading from older versions of marked.js, you may need to separate your configuration:

```javascript
// Old way (confusing)
const config = {
  gfm: true,
  extensions: [customExtension1, customExtension2]
};

// New way (clear separation)
const markdownOptions = {
  gfm: true
};

const customExtensions = {
  extensions: [customExtension1, customExtension2]
};

marked.use(markdownOptions);
marked.use(customExtensions);
```

This separation makes it clear which parts are general configuration and which are custom parsing extensions.
