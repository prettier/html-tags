import assert from "node:assert";
import * as cheerio from "cheerio";
import { getText, uniqueAndSortTags } from "./utilities.js";

async function getHtmlVoidTagsFromWhatwgSyntax() {
  const text = await getText(
    "https://html.spec.whatwg.org/multipage/syntax.html",
  );
  const $ = cheerio.load(text);

  return Array.from(
    $('dt:has(dfn[id="void-elements"]) + dd > code'),
    (element) => $(element).text().trim(),
  );
}

async function getHtmlVoidTags() {
  const data = await getHtmlVoidTagsFromWhatwgSyntax();
  return uniqueAndSortTags(data);
}

export default getHtmlVoidTags;
