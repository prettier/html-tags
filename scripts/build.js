import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { outdent } from "outdent";
import getHtmlTags from "./get-html-tags.js";
import getHtmlVoidTags from "./get-html-void-tags.js";
import {
  toIdentifier,
  toFileBaseName,
  toDefinitionName,
  formatTagsSample,
  updateFile,
  writeFile,
  writeJsonFile,
  updateJsonFile,
} from "./utilities.js";

async function generateDataFiles(data) {
  await Promise.all(
    data.map(({ fileBaseName, tags }) =>
      writeJsonFile(new URL(`../${fileBaseName}.json`, import.meta.url), tags),
    ),
  );
}

async function generateDefinitionsFile(data) {
  const content = data
    .map(
      ({ name, id, definitionName, sample, tags }) => outdent`
        type ${definitionName} =
        ${tags.map((tag) => `  | '${tag}'`).join("\n")};

        /**
        List of ${name}.

        @example
        \`\`\`
        import {${id}} from '@prettier/html-tags'

        console.log(${id});
        //=> ${sample}
        \`\`\`
        */
        export const ${id}: readonly ${definitionName}[];
      `,
    )
    .join("\n\n");

  await writeFile(new URL(`../index.d.ts`, import.meta.url), content);
}

async function generateUsage(data) {
  const readmeFile = new URL(`../readme.md`, import.meta.url);
  await updateFile(readmeFile, (readmeContent) => {
    const START_MARK = "<!-- Usage start -->";
    const END_MARK = "<!-- Usage end -->";
    const startMarkIndex = readmeContent.indexOf(START_MARK);
    const endMarkIndex = readmeContent.indexOf(END_MARK);
    assert.notEqual(startMarkIndex, -1);
    assert.notEqual(endMarkIndex, -1);
    const usageContent = outdent`
      import {${data.map(({ id }) => id)}} from '@prettier/html-tags'

      ${data
        .map(
          ({ id, sample }) =>
            outdent`
              console.log(${id})
              //=> ${sample}
            `,
        )
        .join("\n\n")}
    `;
    return outdent`
      ${readmeContent.slice(0, startMarkIndex + START_MARK.length)}
      ${usageContent}
      ${readmeContent.slice(endMarkIndex)}
    `.trimEnd();
  });
}

async function generateIndexFile(data) {
  await writeFile(
    new URL(`../index.js`, import.meta.url),
    outdent`
      ${data
        .map(
          ({ id, fileBaseName }) => outdent`
            export {default as ${id}} from './${fileBaseName}.json' with {type: 'json'}
          `,
        )
        .join("\n")}
    `,
  );
}

async function updatePackageJson(data) {
  await updateJsonFile(
    new URL("../package.json", import.meta.url),
    (packageJson) => ({
      ...packageJson,
      exports: {
        ".": {
          types: "./index.d.ts",
          default: "./index.js",
        },
        ...Object.fromEntries(
          data.map(({ fileBaseName }) => [
            `./${fileBaseName}`,
            `./${fileBaseName}.json`,
          ]),
        ),
      },
      files: [
        "index.js",
        "index.d.ts",
        ...data.map(({ fileBaseName }) => `${fileBaseName}.json`),
      ],
    }),
  );
}

const data = await Promise.all(
  [
    {
      name: "HTML tags",
      getData: getHtmlTags,
    },
    {
      name: "HTML void tags",
      getData: getHtmlVoidTags,
    },
  ].map(async ({ name, getData }) => {
    const tags = await getData();

    return {
      name,
      id: toIdentifier(name),
      fileBaseName: toFileBaseName(name),
      definitionName: toDefinitionName(name),
      tags,
      sample: formatTagsSample(tags),
    };
  }),
);

await Promise.all(
  [
    generateDataFiles,
    generateDefinitionsFile,
    generateUsage,
    generateIndexFile,
    updatePackageJson,
  ].map((function_) => function_(data)),
);
