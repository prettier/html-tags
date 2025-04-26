import assert from "node:assert/strict";
import test from "node:test";
import htmlTags from "./index.js";

test("Main", () => {
  assert.ok(Array.isArray(htmlTags));
  assert.equal(new Set(htmlTags).size, htmlTags.length);
  // W3C https://raw.githubusercontent.com/w3c/elements-of-html/HEAD/elements.json
  assert.ok(htmlTags.includes("frame"));
  // https://html.spec.whatwg.org/multipage/obsolete.html
  assert.ok(htmlTags.includes("center"));
  // http://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements
  assert.ok(htmlTags.includes("content"));

  for (const tag of htmlTags) {
    assert.ok(/^(?:[a-z]+|h[123456])$/.test(tag), tag);
  }
});
