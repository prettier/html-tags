import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {outdent} from 'outdent'
import getHtmlTags from './get-html-tags.js'
import getHtmlVoidTags from './get-html-void-tags.js'
import {
  toIdentifier,
  toFileBaseName,
  formatTagsSample,
  updateFile,
  writeFile,
  writeJsonFile,
  updateJsonFile,
} from './utilities.js'

async function generateDataFiles(data) {
  await Promise.all(
    data.map(({fileBaseName, tags}) =>
      writeJsonFile(new URL(`../${fileBaseName}.json`, import.meta.url), tags),
    ),
  )
}

async function generateDefinitionsFile(data) {
  const content = data
    .map(
      ({name, id, sample, tags}) => outdent`
        /**
        List of ${name}.

        @example
        \`\`\`js
        import {${id}} from '@prettier/html-tags'

        console.log(${id})
        //=> ${sample}
        \`\`\`
        */
        export const ${id}: readonly [
        ${tags.map((tag) => `  '${tag}',`).join('\n')}
        ]
      `,
    )
    .join('\n\n')

  await writeFile(new URL(`../index.d.ts`, import.meta.url), content)
}

async function generateUsage(data) {
  const readmeFile = new URL(`../readme.md`, import.meta.url)
  await updateFile(readmeFile, (readmeContent) => {
    const START_MARK = '<!-- Usage start -->'
    const END_MARK = '<!-- Usage end -->'
    const startMarkIndex = readmeContent.indexOf(START_MARK)
    const endMarkIndex = readmeContent.indexOf(END_MARK)
    assert.notEqual(startMarkIndex, -1)
    assert.notEqual(endMarkIndex, -1)
    const usageContent = outdent`

      \`\`\`js
      import {
        ${data.map(({id}) => id).join(', ')}
      } from '@prettier/html-tags'

      ${data
        .map(
          ({id, sample}) =>
            outdent`
              console.log(${id})
              //=> ${sample}
            `,
        )
        .join('\n\n')}
      \`\`\`

    `
    return [
      readmeContent.slice(0, startMarkIndex + START_MARK.length),
      usageContent,
      readmeContent.slice(endMarkIndex),
    ].join('\n')
  })
}

async function generateIndexJsonFile(data) {
  await writeJsonFile(
    new URL(`../index.json`, import.meta.url),
    Object.fromEntries(data.map(({id, tags}) => [id, tags])),
  )
}

async function generateIndexFile(data) {
  await writeFile(
    new URL(`../index.js`, import.meta.url),
    outdent`
      ${data
        .map(
          ({id, fileBaseName}) => outdent`
            export {
              default as ${id}
            } from './${fileBaseName}.json' with {type: 'json'}
          `,
        )
        .join('\n')}
    `,
  )
}

async function updatePackageJson(data) {
  await updateJsonFile(
    new URL('../package.json', import.meta.url),
    (packageJson) => ({
      ...packageJson,
      exports: {
        '.': {
          types: './index.d.ts',
          require: './index.json',
          default: './index.js',
        },
        ...Object.fromEntries(
          data.map(({fileBaseName}) => [
            `./${fileBaseName}`,
            `./${fileBaseName}.json`,
          ]),
        ),
      },
      files: [
        'index.js',
        'index.json',
        'index.d.ts',
        ...data.map(({fileBaseName}) => `${fileBaseName}.json`),
      ],
    }),
  )
}

const data = await Promise.all(
  [
    {
      name: 'HTML tags',
      getData: getHtmlTags,
    },
    {
      name: 'HTML void tags',
      getData: getHtmlVoidTags,
    },
  ].map(async ({name, getData}) => {
    const tags = await getData()

    return {
      name,
      id: toIdentifier(name),
      fileBaseName: toFileBaseName(name),
      tags,
      sample: formatTagsSample(tags),
    }
  }),
)

await Promise.all(
  [
    generateDataFiles,
    generateDefinitionsFile,
    generateUsage,
    generateIndexJsonFile,
    generateIndexFile,
    updatePackageJson,
  ].map((function_) => function_(data)),
)
