import fs from "node:fs/promises";

const CACHE_DIRECTORY = new URL("../.cache/", import.meta.url);

/**
@param {string} url
@returns {Promise<string>}
*/
async function getTextFromUrl(url) {
  const cacheFile = new URL(
    url.replaceAll(/[^a-zA-Z\d\.]/g, "-"),
    CACHE_DIRECTORY,
  );

  let stat;

  try {
    stat = await fs.stat(cacheFile);
  } catch {}

  if (stat) {
    if (Date.now() - stat.mtimeMs < /* 10 hours */ 10 * 60 * 60 * 1000) {
      return fs.readFile(cacheFile, "utf8");
    }

    await fs.rm(cacheFile);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Fetch '${url}' failed.`);
  }

  const text = await response.text();

  writeFile(cacheFile, text);

  return text;
}

/** @param {string | string[]} urlOrUrls */
function getText(urlOrUrls) {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  return Promise.any(urls.map((url) => getTextFromUrl(url)));
}

function toIdentifier(name) {
  return name
    .split(" ")
    .map((word, index) => {
      word = word.toLowerCase();
      return index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

function toFileBaseName(name) {
  return name
    .split(" ")
    .map((word) => word.toLowerCase())
    .join("-");
}

function toDefinitionName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function formatTagsSample(tags) {
  const samples = tags.slice(0, 3).map((tag) => `'${tag}'`);
  if (tags.length > 3) {
    samples.push("…");
  }

  return `[${samples.join(", ")}]`;
}

async function writeFile(file, content) {
  const directory = new URL("./", file);
  await fs.mkdir(directory, { recursive: true });
  return fs.writeFile(file, content + "\n");
}

async function updateFile(file, process) {
  return writeFile(file, await process(await fs.readFile(file, "utf8")));
}

async function writeJsonFile(file, data) {
  return writeFile(file, JSON.stringify(data, undefined, 2));
}

async function updateJsonFile(file, process) {
  return updateFile(file, async (content) =>
    JSON.stringify(await process(JSON.parse(content)), undefined, 2),
  );
}

async function uniqueAndSortTags(tags) {
  return [...new Set(tags)].toSorted();
}

export {
  getText,
  toIdentifier,
  toFileBaseName,
  toDefinitionName,
  formatTagsSample,
  writeFile,
  updateFile,
  writeJsonFile,
  updateJsonFile,
  uniqueAndSortTags,
};
