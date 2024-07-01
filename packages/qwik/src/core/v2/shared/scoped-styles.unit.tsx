import { ComponentStylesPrefixContent } from '../../util/markers';
import { describe, expect, it } from 'vitest';
import {
  addComponentStylePrefix,
  convertStyleIdsStringToArray as convertStyleIdsToArray,
  convertStyleIdsArrayToString,
  getScopedStyleIdsAsPrefix,
} from './scoped-styles';

describe('scoped styles utils', () => {
  describe('getScopedStyleIdsAsPrefix', () => {
    it('should generate style ids prefix', () => {
      const styleIds = new Set(['abcd', 'dcba', 'test']);
      const prefixedStyleIds = `${ComponentStylesPrefixContent}abcd ${ComponentStylesPrefixContent}dcba ${ComponentStylesPrefixContent}test`;
      expect(getScopedStyleIdsAsPrefix(styleIds)).toEqual(prefixedStyleIds);
    });
  });

  describe('convertStyleIdsToArray', () => {
    it('should convert style ids string to array', () => {
      expect(convertStyleIdsToArray('abcd dcba test')).toEqual(['abcd', 'dcba', 'test']);
    });

    it('should return null for undefined input', () => {
      expect(convertStyleIdsToArray()).toEqual(null);
    });
  });

  describe('convertStyleIdsToString', () => {
    it('should convert style ids set to string', () => {
      expect(convertStyleIdsArrayToString(['abcd', 'dcba', 'test'])).toEqual('abcd dcba test');
    });
  });

  describe('addComponentStylePrefix', () => {
    it('should ignore falsy values', () => {
      expect(addComponentStylePrefix(null)).toBe(null);
      expect(addComponentStylePrefix(undefined)).toBe(null);
      expect(addComponentStylePrefix('')).toBe(null);
    });

    it('should append style prefix', () => {
      expect(addComponentStylePrefix('a')).toBe(ComponentStylesPrefixContent + 'a');
      expect(addComponentStylePrefix('a b')).toBe(
        ComponentStylesPrefixContent + 'a ' + ComponentStylesPrefixContent + 'b'
      );
      expect(addComponentStylePrefix('long long')).toBe(
        ComponentStylesPrefixContent + 'long ' + ComponentStylesPrefixContent + 'long'
      );
    });
  });
});
