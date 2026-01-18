import fs from 'node:fs/promises'
import {inspect} from 'node:util'
import writePrettierFile from 'write-prettier-file'

const CACHE_DIRECTORY = new URL('../.cache/', import.meta.url)

/**
@param {string} url
@returns {Promise<string>}
*/
async function getTextFromUrl(url) {
  const cacheFile = new URL(
    url.replaceAll(/[^a-zA-Z\d\.]/g, '-'),
    CACHE_DIRECTORY,
  )

  let stat

  try {
    stat = await fs.stat(cacheFile)
  } catch {}

  if (stat) {
    if (Date.now() - stat.mtimeMs < /* 10 hours */ 10 * 60 * 60 * 1000) {
      return fs.readFile(cacheFile, 'utf8')
    }

    await fs.rm(cacheFile)
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Fetch '${url}' failed.`)
  }

  const text = await response.text()

  writeFile(cacheFile, text, /* pretty */ false)

  return text
}

/** @param {string | string[]} urlOrUrls */
function getText(urlOrUrls) {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls]
  return Promise.any(urls.map((url) => getTextFromUrl(url)))
}

function toIdentifier(name) {
  return name
    .split(' ')
    .map((word, index) => {
      word = word.toLowerCase()
      return index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('')
}

function toFileBaseName(name) {
  return name
    .split(' ')
    .map((word) => word.toLowerCase())
    .join('-')
}

function toDefinitionName(name) {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function formatTagsSample(tags) {
  return inspect(tags, {maxArrayLength: 3})
    .replaceAll('\n', '')
    .replaceAll(/(?<=\[) |  | (?=])/g, '')
    .replaceAll(/,\s?/g, ', ')
}

async function writeFile(file, content, pretty = true) {
  const directory = new URL('./', file)
  await fs.mkdir(directory, {recursive: true})
  return pretty ? writePrettierFile(file, content) : fs.writeFile(file, content)
}

async function updateFile(file, process) {
  return writeFile(file, await process(await fs.readFile(file, 'utf8')))
}

async function writeJsonFile(file, data) {
  return writeFile(file, JSON.stringify(data, undefined, 2))
}

async function updateJsonFile(file, process) {
  return updateFile(file, async (content) =>
    JSON.stringify(await process(JSON.parse(content)), undefined, 2),
  )
}

async function uniqueAndSortTags(tags) {
  return [...new Set(tags)].toSorted()
}

export {
  getText,
  toIdentifier,
  toFileBaseName,
  formatTagsSample,
  writeFile,
  updateFile,
  writeJsonFile,
  updateJsonFile,
  uniqueAndSortTags,
}
