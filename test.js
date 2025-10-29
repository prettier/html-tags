import assert from 'node:assert/strict';
import test from 'node:test';
import {htmlTags, htmlVoidTags} from './index.js';

test('HTML Tags', () => {
  assert.ok(Array.isArray(htmlTags));
  assert.equal(new Set(htmlTags).size, htmlTags.length);
  // W3C https://raw.githubusercontent.com/w3c/elements-of-html/HEAD/elements.json
  assert.ok(htmlTags.includes('frame'));
  // https://html.spec.whatwg.org/multipage/obsolete.html
  assert.ok(htmlTags.includes('center'));
  // http://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements
  assert.ok(htmlTags.includes('content'));

  for (const tag of htmlTags) {
    assert.ok(/^(?:[a-z]+|h[123456])$/.test(tag), tag);
  }
});

test('HTML Void Tags', () => {
  assert.ok(Array.isArray(htmlVoidTags));
  assert.equal(new Set(htmlVoidTags).size, htmlVoidTags.length);
  // https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments
  assert.ok(htmlTags.includes('basefont'));
  assert.ok(htmlVoidTags.includes('img'));

  for (const tag of htmlVoidTags) {
    assert.ok(htmlTags.includes(tag));
    assert.ok(/^[a-z]+$/.test(tag), tag);
  }
});
