import { describe, expect, test } from 'vitest';
import { createMdxTransformer } from './mdx';

describe('mdx', () => {
  test('convert mdx', async () => {
    const ctx = {
      frontmatter: new Map(),
      opts: {
        mdx: {
          remarkPlugins: [],
          rehypePlugins: [],
        },
        mdxPlugins: {},
      },
    };
    const transformer = await createMdxTransformer(ctx as any);
    const mdx = `
# Hello
<a href="http://example.com">Hello</a>
<div>World</div>
`;
    const result = await transformer(mdx, 'file.mdx');
    // It could be that new mdx versions change this output, make sure it still makes sense
    expect(result).toMatchInlineSnapshot(`
      {
        "code": "import { _jsxC, RenderOnce } from '@builder.io/qwik';
      import {Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs} from "@builder.io/qwik/jsx-runtime";
      export const headings = [{
        "text": "Hello",
        "id": "hello",
        "level": 1
      }];
      export const frontmatter = undefined;
      function _createMdxContent(props) {
        const _components = {
          a: "a",
          h1: "h1",
          span: "span",
          ...props.components
        };
        return _jsxs(_Fragment, {
          children: [_jsxs(_components.h1, {
            id: "hello",
            children: [_jsx(_components.a, {
              "aria-hidden": "true",
              tabindex: "-1",
              href: "#hello",
              children: _jsx(_components.span, {
                class: "icon icon-link"
              })
            }), "Hello"]
          }), "\\n", _jsx("a", {
            href: "http://example.com",
            children: "Hello"
          }), "\\n", _jsx("div", {
            children: "World"
          })]
        });
      }

      const WrappedMdxContent = () => {
        return _jsxC(RenderOnce, {children: _jsxC(_createMdxContent, {}, undefined, 3, null)}, undefined, 3, "eB2HIyA1");
      };
      export default WrappedMdxContent;
      ",
        "map": {
          "file": "file.mdx",
          "mappings": ";;;;;;;;;;;;;;;;;;;;;;;;UACE;;;gBAC2B;;gBACxB",
          "names": [],
          "sources": [
            "file.mdx",
          ],
          "version": 3,
        },
      }
    `);
  });
});
