/**
 * @file
 *
 *   VNodeData is additional information which allows the `vnode` to recover virtual VNode information
 *   from the HTML.
 */

/**
 * VNodeDataSeparator contains information about splitting up the VNodeData and attaching it to the
 * HTML.
 */
export const VNodeDataSeparator = {
  REFERENCE_CH: /* ***** */ `~`, // `~` is a reference to the node. Save it.
  REFERENCE: /* ******** */ 126, // `~` is a reference to the node. Save it.
  ADVANCE_1_CH: /* ***** */ `!`, // `!` is vNodeData separator skipping 0. (ie next vNode)
  ADVANCE_1: /* ********* */ 33, // `!` is vNodeData separator skipping 0. (ie next vNode)
  ADVANCE_2_CH: /* ***** */ `"`, // `"` is vNodeData separator skipping 1.
  ADVANCE_2: /* ********* */ 34, // `"` is vNodeData separator skipping 1.
  ADVANCE_4_CH: /* ***** */ `#`, // `#` is vNodeData separator skipping 2.
  ADVANCE_4: /* ********* */ 35, // `#` is vNodeData separator skipping 2.
  ADVANCE_8_CH: /* ***** */ `$`, // `$` is vNodeData separator skipping 4.
  ADVANCE_8: /* ********* */ 36, // `$` is vNodeData separator skipping 4.
  ADVANCE_16_CH: /* **** */ `%`, // `%` is vNodeData separator skipping 8.
  ADVANCE_16: /* ******** */ 37, // `%` is vNodeData separator skipping 8.
  ADVANCE_32_CH: /* **** */ `&`, // `&` is vNodeData separator skipping 16.
  ADVANCE_32: /* ******** */ 38, // `&` is vNodeData separator skipping 16.
  ADVANCE_64_CH: /* **** */ `'`, // `'` is vNodeData separator skipping 32.
  ADVANCE_64: /* ******** */ 39, // `'` is vNodeData separator skipping 32.
  ADVANCE_128_CH: /* *** */ `(`, // `(` is vNodeData separator skipping 64.
  ADVANCE_128: /* ******* */ 40, // `(` is vNodeData separator skipping 64.
  ADVANCE_256_CH: /* *** */ `)`, // `)` is vNodeData separator skipping 128.
  ADVANCE_256: /* ******* */ 41, // `)` is vNodeData separator skipping 128.
  ADVANCE_512_CH: /* *** */ `*`, // `*` is vNodeData separator skipping 256.
  ADVANCE_512: /* ******* */ 42, // `*` is vNodeData separator skipping 256.
  ADVANCE_1024_CH: /* ** */ `+`, // `+` is vNodeData separator skipping 512.
  ADVANCE_1024: /* ****** */ 43, // `+` is vNodeData separator skipping 512.
  ADVANCE_2048_CH: /* *  */ ',', // ',' is vNodeData separator skipping 1024.
  ADVANCE_2048: /* ****** */ 44, // ',' is vNodeData separator skipping 1024.
  ADVANCE_4096_CH: /* *  */ `-`, // `.` is vNodeData separator skipping 2048.
  ADVANCE_4096: /* ****** */ 45, // `.` is vNodeData separator skipping 2048.
  ADVANCE_8192_CH: /* *  */ `.`, // `/` is vNodeData separator skipping 4096.
  ADVANCE_8192: /* ****** */ 46, // `/` is vNodeData separator skipping 4096.
};

/** VNodeDataChar contains information about the VNodeData used for encoding props */
export const VNodeDataChar = {
  OPEN: /* ************** */ 123, // `{` is the start of the VNodeData.
  OPEN_CHAR: /* ****** */ '{',
  CLOSE: /* ************* */ 125, // `}` is the end of the VNodeData.
  CLOSE_CHAR: /* ***** */ '}',

  SCOPED_STYLE: /* ******* */ 59, // `;` - `q:sstyle` - Scoped style attribute.
  SCOPED_STYLE_CHAR: /* */ ';',
  RENDER_FN: /* ********** */ 60, // `<` - `q:renderFn' - Component QRL render function (body)
  RENDER_FN_CHAR: /* ** */ '<',
  ID: /* ***************** */ 61, // `=` - `q:id` - ID of the element.
  ID_CHAR: /* ********* */ '=',
  PROPS: /* ************** */ 62, // `>` - `q:props' - Component Props
  PROPS_CHAR: /* ****** */ '>',
  SLOT_REF: /* *********** */ 63, // `?` - `q:sref` - Slot reference.
  SLOT_REF_CHAR: /* *** */ '?',
  KEY: /* **************** */ 64, // `@` - `q:key` - Element key.
  KEY_CHAR: /* ******** */ '@',
  SEQ: /* **************** */ 91, // `[` - `q:seq' - Seq value from `useSequentialScope()`
  SEQ_CHAR: /* ******** */ '[',
  DON_T_USE: /* ********** */ 93, // `\` - SKIP because `\` is used as escaping
  DON_T_USE_CHAR: '\\',
  CONTEXT: /* ************ */ 93, // `]` - `q:ctx' - Component context/props
  CONTEXT_CHAR: /* **** */ ']',
  SEQ_IDX: /* ************ */ 94, // `^` - `q:seqIdx' - Sequential scope id
  SEQ_IDX_CHAR: /* **** */ '^',
  STYLE: /* ************** */ 96, // '`' - `q:style' - Style attribute.
  STYLE_CHAR: /* ****** */ '`',
  SEPARATOR: /* ********* */ 124, // `|` - Separator char to encode any key/value pairs.
  SEPARATOR_CHAR: /* ** */ '|',
  SLOT: /* ************** */ 126, // `~` - `q:slot' - Slot name
  SLOT_CHAR: /* ******* */ '~',
};
