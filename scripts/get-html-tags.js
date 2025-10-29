import assert from "node:assert";
import * as cheerio from "cheerio";
import { getText, uniqueAndSortTags } from "./utilities.js";

async function getHtmlTagsFromHtmlSpecification() {
  const text = await getText([
    "https://raw.githubusercontent.com/whatwg/html/HEAD/source",
    "https://cdn.jsdelivr.net/gh/whatwg/html/source",
  ]);
  const $ = cheerio.load(text);

  return Array.from($("dfn[element] > code"), (element) =>
    $(element).text().trim(),
  );
}

async function getHtmlTagsFromMdn() {
  const text = await getText(
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements",
  );
  const $ = cheerio.load(text);

  return Array.from($("tr > td:first-child > code"), (element) => {
    const text = $(element).text().trim();
    if (!/^<(?:[a-z]+|h[123456])>$/.test(text)) {
      return;
    }

    return text.slice(1, -1);
  }).filter(Boolean);
}

async function getHtmlTagsFromHtmlSpecificationIndices() {
  const text = await getText(
    "https://html.spec.whatwg.org/multipage/indices.html",
  );
  const $ = cheerio.load(text);
  const table = $("#elements-3 ~ table")[0];

  return Array.from($("th:first-child code", table), (element) =>
    $(element).text().trim(),
  );
}

async function getHtmlTagsFromHtmlSpecificationObsolete() {
  const text = await getText(
    "https://html.spec.whatwg.org/multipage/obsolete.html",
  );
  const $ = cheerio.load(text);
  const container = $("#non-conforming-features ~ dl")[0];

  return Array.from($("> dt > dfn > code", container), (element) =>
    $(element).text().trim(),
  );
}

async function getHtmlTagsFromW3c() {
  const text = await getText([
    "https://raw.githubusercontent.com/w3c/elements-of-html/HEAD/elements.json",
    "https://cdn.jsdelivr.net/gh/w3c/elements-of-html/elements.json",
  ]);

  return JSON.parse(text)
    .map(({ element }) => element)
    .filter((tagName) => /^(?:[a-z]+|h[123456])$/.test(tagName));
}

async function getHtmlTags() {
  const data = await Promise.all(
    [
      getHtmlTagsFromHtmlSpecification,
      getHtmlTagsFromMdn,
      getHtmlTagsFromHtmlSpecificationIndices,
      getHtmlTagsFromHtmlSpecificationObsolete,
      getHtmlTagsFromW3c,
    ].map((function_) => function_()),
  );

  let tags = [
    // https://www.w3.org/TR/2011/WD-html5-author-20110809/the-command-element.html
    "command",
    ...data.flat(),
  ];

  return uniqueAndSortTags(tags);
}

export default getHtmlTags;
