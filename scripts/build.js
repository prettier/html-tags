import fs from "node:fs/promises";
import * as cheerio from "cheerio";
import { outdent } from "outdent";

const CACHE_DIRECTORY = new URL("../.cache/", import.meta.url);

const getText = async (url) => {
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

  await fs.mkdir(CACHE_DIRECTORY, { recursive: true });
  await fs.writeFile(cacheFile, text);

  return text;
};

const data = await Promise.all(
  [
    async () => {
      const text = await Promise.any([
        getText("https://raw.githubusercontent.com/whatwg/html/HEAD/source"),
        getText("https://cdn.jsdelivr.net/gh/whatwg/html/source"),
      ]);
      const $ = cheerio.load(text);

      return Array.from($("dfn[element] > code"), (element) =>
        $(element).text().trim(),
      );
    },
    async () => {
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
    },
    async () => {
      const text = await getText(
        "https://html.spec.whatwg.org/multipage/indices.html",
      );
      const $ = cheerio.load(text);
      const table = $("#elements-3 ~ table")[0];

      return Array.from($("th:first-child code", table), (element) =>
        $(element).text().trim(),
      );
    },
    async () => {
      const text = await getText(
        "https://html.spec.whatwg.org/multipage/obsolete.html",
      );
      const $ = cheerio.load(text);
      const container = $("#non-conforming-features ~ dl")[0];

      return Array.from($("> dt > dfn > code", container), (element) =>
        $(element).text().trim(),
      );
    },
    async () => {
      const text = await Promise.any([
        getText(
          "https://raw.githubusercontent.com/w3c/elements-of-html/HEAD/elements.json",
        ),
        getText(
          "https://cdn.jsdelivr.net/gh/w3c/elements-of-html/elements.json",
        ),
      ]);

      return JSON.parse(text)
        .map(({ element }) => element)
        .filter((tagName) => /^(?:[a-z]+|h[123456])$/.test(tagName));
    },
  ].map((function_) => function_()),
);

let tags = [
  ...new Set([
    // https://www.w3.org/TR/2011/WD-html5-author-20110809/the-command-element.html
    "command",
    ...data.flat(),
  ]),
].sort();

await fs.writeFile(
  new URL(`../index.json`, import.meta.url),
  JSON.stringify(tags, undefined, 2) + "\n",
);

await fs.writeFile(
  new URL(`../index.d.ts`, import.meta.url),
  outdent`
		type HtmlTags =
		${tags.map((tag) => `  | '${tag}'`).join("\n")};

		/**
		List of HTML tags.

		@example
		\`\`\`
		import htmlTags from "@prettier/html-tags";

		console.log(htmlTags);
		//=> ['a', 'abbr', 'acronym', …]
		\`\`\`
		*/
		declare const htmlTags: readonly HtmlTags[];

		export default htmlTags;
	`,
);
