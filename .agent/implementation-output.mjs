const FILE_BLOCK_PATTERN =
  /^[ \t]*===[ \t]*FILE:[ \t]*(.+?)[ \t]*===[ \t]*\r?\n([\s\S]*?)^[ \t]*===[ \t]*END[ \t]+FILE[ \t]*===[ \t]*\r?$/gm;

export function parseFileBlocks(output) {
  const files = [];
  const seen = new Set();
  let match;

  FILE_BLOCK_PATTERN.lastIndex = 0;
  while ((match = FILE_BLOCK_PATTERN.exec(output)) !== null) {
    const path = match[1].trim();
    if (seen.has(path)) {
      throw new Error(`Agent returned the same file more than once: ${path}`);
    }
    seen.add(path);
    files.push({ path, content: match[2].trim() });
  }

  return files;
}

export function planFileBatches(
  files,
  { maxFiles = 3, maxCharacters = 30_000, newFileCharacters = 12_000 } = {},
) {
  if (!Number.isInteger(maxFiles) || maxFiles < 1) {
    throw new Error("maxFiles must be a positive integer.");
  }
  if (!Number.isInteger(maxCharacters) || maxCharacters < 1) {
    throw new Error("maxCharacters must be a positive integer.");
  }

  const batches = [];
  let batch = [];
  let batchCharacters = 0;

  for (const file of files) {
    const characters = file.characters ?? newFileCharacters;
    const shouldStartNewBatch =
      batch.length > 0 &&
      (batch.length >= maxFiles ||
        batchCharacters + characters > maxCharacters);

    if (shouldStartNewBatch) {
      batches.push(batch);
      batch = [];
      batchCharacters = 0;
    }

    batch.push(file.path);
    batchCharacters += characters;
  }

  if (batch.length > 0) batches.push(batch);
  return batches;
}
