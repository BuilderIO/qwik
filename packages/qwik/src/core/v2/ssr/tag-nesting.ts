/**
 * @file
 *
 *   This file contains element tag nesting rules of HTML.
 *
 *   The rules are encoded as switch statements rather than as object literal lookups because:
 *
 *   1. Switch statements are faster than object literal lookups.
 *   2. Switch statements do not put pressure on megamorphic property caches.
 *   3. Switch statements are more verbose, hoverer they are on server only hence we don't care.
 *
 *   See: https://jsbench.me/hxlqu5wof5/1 In our case it is about 4x faster (not accounting for
 *   megamorphic property cache)
 */

export const enum TagNesting {
  NOT_ALLOWED = /* ---- */ 0b0000_0000_0000_0000,
  DOCUMENT = /* ------- */ 0b0000_0000_0000_0001,
  TEXT = /* ----------- */ 0b0000_0000_0000_0010,
  EMPTY = /* ---------- */ 0b0000_0000_0000_0100,
  ANYTHING = /* ------- */ 0b0000_0000_0000_1010,
  HTML = /* ----------- */ 0b0000_0000_0010_0000,
  HEAD = /* ----------- */ 0b0000_0000_0100_0000,
  BODY = /* ----------- */ 0b0000_0000_1000_0010,
  PHRASING = /* ------- */ 0b0000_0001_0000_0010,
  /** Table related tags. */
  TABLE = /* ---------- */ 0b0001_0000_0000_0000,
  TABLE_BODY = /* ----- */ 0b0010_0000_0000_0000,
  TABLE_ROW = /* ------ */ 0b0100_0000_0000_0000,
  TABLE_COLGROUP = /* - */ 0b1000_0000_0000_0000,
}

export const allowedContent = (state: TagNesting): [string, string | null] => {
  switch (state) {
    case TagNesting.TEXT:
      return ['text content', null];
    case TagNesting.NOT_ALLOWED:
      return ['no content', null];
    case TagNesting.HTML:
      return ['html content', '<head>, <body>'];
    case TagNesting.HEAD:
      return [
        'head content',
        '<title>, <script>, <noscript>, <style>, <meta>, <link>, <base>, <template>',
      ];
    case TagNesting.BODY:
      return ['body content', 'all tags allowed here'];
    case TagNesting.EMPTY:
      return ['no-content element', null];
    case TagNesting.ANYTHING:
      return ['any content', null];
    case TagNesting.TABLE:
      return ['table', '<caption>, <colgroup>, <tbody>, <thead>, <tfoot>'];
    case TagNesting.TABLE_BODY:
      return ['table body', '<tr>'];
    case TagNesting.TABLE_ROW:
      return ['table row', '<td>, <th>'];
    case TagNesting.TABLE_COLGROUP:
      return ['table column group', '<col>'];
    case TagNesting.PHRASING:
      return ['phrasing content', '<a>, <b>, <img>, <input> ... (no <div>, <p> ...)'];
    case TagNesting.DOCUMENT:
      return ['document', '<html>'];
  }
};

export const initialTag = (tag: string) => {
  switch (tag) {
    case 'html':
      return TagNesting.HTML;
    case 'head':
      return TagNesting.HEAD;
    case 'body':
      return TagNesting.BODY;
    default:
      return isTagAllowed(TagNesting.ANYTHING, tag);
  }
};

/** Determine if the tag is allowed to be nested inside the current tag. */
export function isTagAllowed(state: number, tag: string): number {
  switch (state) {
    case TagNesting.TEXT:
    case TagNesting.NOT_ALLOWED:
      return TagNesting.NOT_ALLOWED;
    case TagNesting.HTML:
      return isInHtml(tag);
    case TagNesting.HEAD:
      return isInHead(tag);
    case TagNesting.BODY:
    case TagNesting.ANYTHING:
      return isInAnything(tag);
    case TagNesting.TABLE:
      return isInTable(tag);
    case TagNesting.TABLE_BODY:
      return isInTableBody(tag);
    case TagNesting.TABLE_ROW:
      return isInTableRow(tag);
    case TagNesting.TABLE_COLGROUP:
      return isInTableColGroup(tag);
    case TagNesting.PHRASING:
      return isInPhrasing(tag);
    case TagNesting.DOCUMENT:
      if (tag === 'html') {
        return TagNesting.HTML;
      }
  }
  return TagNesting.NOT_ALLOWED;
}

function isInHtml(text: string): number {
  switch (text) {
    case 'head':
      return TagNesting.HEAD;
    case 'body':
      return TagNesting.BODY;
    default:
      return TagNesting.NOT_ALLOWED;
  }
}

function isInHead(text: string): number {
  switch (text) {
    case 'title':
    case 'script':
    case 'noscript':
    case 'style':
      return TagNesting.TEXT;
    case 'meta':
    case 'link':
    case 'base':
      return TagNesting.EMPTY;
    case 'template':
      return TagNesting.ANYTHING;
    default:
      return TagNesting.NOT_ALLOWED;
  }
}

function isInAnything(text: string): number {
  switch (text) {
    case 'script':
    case 'style':
    case 'noscript':
    case 'noframes':
      return TagNesting.TEXT;
    case 'area':
    case 'base':
    case 'basefont':
    case 'bgsound':
    case 'br':
    case 'col':
    case 'embed':
    case 'frame':
    case 'hr':
    case 'img':
    case 'input':
    case 'keygen':
    case 'link':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr':
      return TagNesting.EMPTY;
    case 'p':
    case 'pre':
      return TagNesting.PHRASING;
    case 'table':
      return TagNesting.TABLE;
    case 'html':
    case 'head':
    case 'body':
      return TagNesting.NOT_ALLOWED;

    default:
      return TagNesting.ANYTHING;
  }
}

function isInTable(text: string): number {
  switch (text) {
    case 'caption':
      return TagNesting.ANYTHING;
    case 'colgroup':
      return TagNesting.TABLE_COLGROUP;
    case 'tbody':
    case 'thead':
    case 'tfoot':
      return TagNesting.TABLE_BODY;
    default:
      return TagNesting.NOT_ALLOWED;
  }
}

function isInTableBody(text: string): number {
  switch (text) {
    case 'tr':
      return TagNesting.TABLE_ROW;
    default:
      return TagNesting.NOT_ALLOWED;
  }
}

function isInTableRow(text: string): number {
  switch (text) {
    case 'td':
    case 'th':
      return TagNesting.ANYTHING;
    default:
      return TagNesting.NOT_ALLOWED;
  }
}

function isInTableColGroup(text: string): number {
  switch (text) {
    case 'col':
      return TagNesting.EMPTY;
    default:
      return TagNesting.NOT_ALLOWED;
  }
}

function isInPhrasing(text: string): number {
  switch (text) {
    case 'a':
    case 'abbr':
    case 'area':
    case 'audio':
    case 'b':
    case 'bdi':
    case 'bdo':
    case 'br':
    case 'button':
    case 'canvas':
    case 'cite':
    case 'code':
    case 'command':
    case 'data':
    case 'datalist':
    case 'del':
    case 'dfn':
    case 'em':
    case 'embed':
    case 'i':
    case 'iframe':
    case 'img':
    case 'input':
    case 'ins':
    case 'itemprop':
    case 'kbd':
    case 'keygen':
    case 'label':
    case 'link':
    case 'map':
    case 'mark':
    case 'math':
    case 'meta':
    case 'meter':
    case 'noscript':
    case 'object':
    case 'option':
    case 'output':
    case 'picture':
    case 'progress':
    case 'q':
    case 'ruby':
    case 's':
    case 'samp':
    case 'script':
    case 'select':
    case 'slot':
    case 'small':
    case 'span':
    case 'strong':
    case 'sub':
    case 'sup':
    case 'svg':
    case 'template':
    case 'textarea':
    case 'time':
    case 'u':
    case 'var':
    case 'video':
    case 'wbr':
      return TagNesting.PHRASING;
    default:
      return TagNesting.NOT_ALLOWED;
  }
}