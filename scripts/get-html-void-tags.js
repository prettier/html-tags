import assert from "node:assert";
import * as cheerio from "cheerio";
import { getText, uniqueAndSortTags } from "./utilities.js";

async function getHtmlVoidTagsFromHtmlSpecificationParsing() {

  const text = await getText(
    "https://html.spec.whatwg.org/multipage/parsing.html",
  );
  const $ = cheerio.load(text);
const container = $('div[data-algorithm]:has(a[id="serialising-html-fragments:void-elements"])')
assert.equal(container.length, 1)

const elements= $('code', container)
assert.notEqual(elements.length, 0)

  return Array.from(
    elements,
    (element) => $(element).text().trim(),
  );
}

async function getHtmlVoidTagsFromHtmlSpecificationSyntax() {
  const text = await getText(
    "https://html.spec.whatwg.org/multipage/syntax.html",
  );
  const $ = cheerio.load(text);
  const elements = $('dt:has(dfn[id="void-elements"]) + dd > code')

assert.notEqual(elements.length, 0)

  return Array.from(
    elements,
    (element) => $(element).text().trim(),
  );
}

async function getHtmlVoidTags() {
  const data = await Promise.all([
getHtmlVoidTagsFromHtmlSpecificationSyntax, 
getHtmlVoidTagsFromHtmlSpecificationParsing
].map(function_ => function_()));
  return uniqueAndSortTags([
...data.flat()]);
}

export default getHtmlVoidTags;
