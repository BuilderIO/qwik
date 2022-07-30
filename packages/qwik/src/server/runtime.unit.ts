import * as qwik from './runtime';
import { test } from 'uvu';
import { equal } from 'uvu/assert';

test('server runtime', async () => {
  const identifier = 'somevalue';
  const cond = true;
  const prevText = 'Previous article';
  async function Cmp({ prop }: any) {
    return qwik.createElement(['<cmp>', prop, '</cmp>']);
  }
  const stuff = qwik.createElement([
    '<div prop="23" nu="12"',
    qwik.createProp('value', identifier),
    '>hola<span>thing</span>',
    qwik.createVirtual(Cmp, {
      prop: 'text',
    }),
    '<div class="flex-1">',
    cond ? qwik.createElement(['<a class="px-3 py-1 prev">', prevText, '</a>']) : null,
    '</div></div>',
  ]);

  const str = await qwik.renderToString(stuff);
  equal(
    str,
    '<div prop="23" nu="12" value="somevalue">hola<span>thing</span><cmp>text</cmp><div class="flex-1"><a class="px-3 py-1 prev">Previous article</a></div></div>'
  );
});
