# Thesis: Optimize hot path in Tokenizer loop

Profile and optimize the main tokenization loop in Tokenizer.ts. Likely candidates: reduce function call overhead by inlining hot helper functions, eliminate redundant property lookups, or cache frequently accessed values.
