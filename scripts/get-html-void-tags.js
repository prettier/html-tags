import assert from 'node:assert';
import * as cheerio from 'cheerio';
import { getText, uniqueAndSortTags } from './utilities.js';

async function getHtmlVoidTagsFromHtmlSpecificationParsing() {
  const text = await getText(
    'https://html.spec.whatwg.org/multipage/parsing.html',
  );
  const $ = cheerio.load(text);
  const container = $(
    'div[data-algorithm]:has(a[id="serialising-html-fragments:void-elements"])',
  );
  assert.equal(container.length, 1);

  const elements = $('code', container);
  assert.notEqual(elements.length, 0);

  return Array.from(elements, (element) => $(element).text().trim());
}

async function getHtmlVoidTagsFromHtmlSpecificationSyntax() {
  const text = await getText(
    'https://html.spec.whatwg.org/multipage/syntax.html',
  );
  const $ = cheerio.load(text);
  const elements = $('dt:has(dfn[id="void-elements"]) + dd > code');

  assert.notEqual(elements.length, 0);

  return Array.from(elements, (element) => $(element).text().trim());
}

async function getHtmlVoidTags() {
  const data = await Promise.all(
    [
      getHtmlVoidTagsFromHtmlSpecificationSyntax,
      getHtmlVoidTagsFromHtmlSpecificationParsing,
    ].map((function_) => function_()),
  );
  return uniqueAndSortTags([
    // https://www.w3.org/TR/2011/WD-html5-author-20110809/the-command-element.html
    'command',
    // From https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements
    // An ancient and poorly supported precursor to the `<img>` element. It should not be used.
    'image',
    ...data.flat(),
  ]);
}

export default getHtmlVoidTags;
