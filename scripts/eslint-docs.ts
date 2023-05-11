import * as fs from 'fs';
import { resolve } from 'path';
import { format } from 'prettier';
import { rules, configs } from '../packages/eslint-plugin-qwik/index';

const outputPath = resolve(
  process.cwd(),
  'packages/docs/src/routes/docs/(qwik)/advanced/eslint/rules.json'
);

const outputPathMdx = resolve(
  process.cwd(),
  'packages/docs/src/routes/docs/(qwik)/advanced/eslint/mdx/index.mdx'
);

fs.writeFileSync(outputPath, JSON.stringify({ rules, configs }, null, 2));

function escapeHtml(htmlStr: string) {
  return htmlStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const rulesMap = Object.keys(rules).map((rule) => {
  return {
    name: rule,
    description: escapeHtml(rules[rule].meta.docs.description),
    recommended: configs.recommended.rules[`qwik/${rule}`] || false,
    strict: configs.strict.rules[`qwik/${rule}`] || false,
    messages: rules[rule].meta.messages,
    examples: rules[rule].meta.examples,
  };
});

const mdx = [];

mdx.push(`import '../styles.css';\n\n`);

mdx.push('<div>');

mdx.push('<h1 id="smth">ESLint-Rules</h1>');
mdx.push('<p>Qwik comes with an own set of ESLint rules to help developers write better code.</p>');

mdx.push(`
<div class="bg-slate-50 rounded-md border border-slate-200 mt-4 grid grid-cols-4 text-sm panel">
  <div class="list-none border-r border-slate-200 my-6 px-6 panel-border">
    <span class="opacity-50 block mb-2">✅</span>
    <b>Warn</b> in 'recommended' ruleset
  </div>
  <div class="list-none border-r border-slate-200 my-6 px-6 panel-border">
    <span class="block mb-2">✅</span>
    <b>Error</b> in 'recommended' ruleset
  </div>
  <div class="list-none border-r border-slate-200 my-6 px-6 panel-border">
    <span class="opacity-50 block mb-2">🔔</span>
    <b>Warn</b> in 'strict' ruleset
  </div>
  <div class="list-none my-6 px-6">
    <span class="block mb-2">🔔</span>
    <b>Error</b> in 'strict' ruleset
  </div>
</div>
`);

mdx.push(`<h2>Possible Problems</h2>`);
mdx.push(`<p>These rules are available.</p>`);

mdx.push(`<div class="my-6">`);
rulesMap.forEach((rule) => {
  mdx.push(`  
    <a href="#${rule.name}" class="bg-slate-50 rounded-md p-4 mt-4 flex cursor-pointer panel">
      <div class="flex-1">
        <code>${rule.name}</code>
        <span class="text-xs block mt-2 max-w-[90%] leading-5">${rule.description}</span>
      </div>
      <div class="flex gap-2 items-center">
        <span
          class={{
            'opacity-100': ${rule.recommended === false},
            'opacity-50': ${rule.recommended === 'warn'},
          }}     
        >
          ✅
        </span>
        <span
          class={{
            'opacity-100': ${rule.strict === false},
            'opacity-50': ${rule.strict === 'warn'},
          }}
        >
          🔔
        </span>
      </div>
    </a>
  `);
});
mdx.push(`</div>`);

mdx.push(`<h2>Details</h2>`);
mdx.push(`<div class="my-6">`);
rulesMap.forEach((rule) => {
  mdx.push(`
    <div>
      <h3 id="${rule.name}">${rule.name}</h3>
      <span>${rule.description}</span>
  `);
  Object.keys(rule.messages).map((messageKey) => {
    mdx.push(`
      <h4>${messageKey}</h4>
    `);
    rule?.examples?.[messageKey]?.good?.map((example) => {
      mdx.push('```js');
      mdx.push(example.code);
      mdx.push('```');
    });
  });
  mdx.push(`
    </div>
  `);
});
mdx.push(`</div>`);

mdx.push(`</div>`);

fs.writeFileSync(outputPathMdx, format(mdx.join('\n'), { parser: 'markdown' }));
