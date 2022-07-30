import { createDocument, createWindow, ensureGlobals } from './document';
import { pathToFileURL } from 'url';
import { suite, test } from 'uvu';
import { equal, match, not, throws } from 'uvu/assert';

test('should create document', () => {
  const win = createWindow({
    url: pathToFileURL(__filename),
  });
  match(win.document.baseURI, 'file://');
  match(win.document.baseURI, 'document.unit.ts');
});

const ensureGlobalsSuite = suite('ensureGlobals');

ensureGlobalsSuite('noop history.go()', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  not.throws(() => {
    glb.history.go(1);
  });
});

ensureGlobalsSuite('noop history.back()', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  not.throws(() => {
    glb.history.back();
  });
});

ensureGlobalsSuite('noop history.forward()', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  not.throws(() => {
    glb.history.forward();
  });
});

ensureGlobalsSuite('noop history.replaceState()', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  not.throws(() => {
    glb.history.replaceState(null, '', '/url');
  });
});

ensureGlobalsSuite('noop history.pushState()', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  not.throws(() => {
    glb.history.pushState(null, '', '/url');
  });
});

ensureGlobalsSuite('noop addEventListener', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  not.throws(() => {
    glb.addEventListener('load', () => {});
  });
});

ensureGlobalsSuite('noop removeEventListener', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  not.throws(() => {
    glb.removeEventListener('load', () => {});
  });
});

ensureGlobalsSuite('baseURI', () => {
  const glb = ensureGlobals({ nodeType: 9 }, { url: 'http://my.qwik.dev/my-path' });
  equal(glb.document.baseURI, 'http://my.qwik.dev/my-path');

  glb.document.baseURI = 'http://my.qwik.dev/new-path';
  equal(glb.document.baseURI, 'http://my.qwik.dev/new-path');
});

ensureGlobalsSuite('location, no options', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  equal(glb.location.pathname, '/');

  glb.location.pathname = '/new-path';
  equal(glb.location.pathname, '/new-path');
});

ensureGlobalsSuite('location', () => {
  const glb = ensureGlobals({ nodeType: 9 }, { url: '/my-path' });
  equal(glb.location.pathname, '/my-path');
});

ensureGlobalsSuite('origin, no options', () => {
  const glb = ensureGlobals({ nodeType: 9 }, {});
  equal(glb.origin, 'http://document.qwik.dev');
});

ensureGlobalsSuite('origin', () => {
  const glb = ensureGlobals({ nodeType: 9 }, { url: '/my-path' });
  equal(glb.origin, 'http://document.qwik.dev');
});

ensureGlobalsSuite('invalid document', () => {
  throws(() => {
    ensureGlobals({}, {});
  });
});

ensureGlobalsSuite('qwik server createDocument()', () => {
  const doc = createDocument();
  not.equal(doc.defaultView, undefined);
  equal(doc.defaultView!.document, doc);
});

ensureGlobalsSuite('qwik server createWindow()', () => {
  const win = createWindow();
  not.equal(win.document.defaultView, undefined);
  equal(win.document.defaultView, win);
});

ensureGlobalsSuite('some other document', () => {
  const doc: any = {
    nodeType: 9,
  };
  ensureGlobals(doc, {});
  ensureGlobals(doc, {}); // shouldn't reset
  not.equal(doc.defaultView, undefined);
  equal(doc.defaultView.document, doc);
});

ensureGlobalsSuite.run();
