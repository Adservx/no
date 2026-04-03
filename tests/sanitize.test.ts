import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText, sanitizeUrl, isValidEmail, sanitizeFilename } from '../utils/sanitize';

describe('sanitize utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const dirty = '<script>alert("xss")</script><p>Hello</p>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('script');
      expect(clean).toContain('Hello');
    });

    it('should allow safe tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const clean = sanitizeHtml(input);
      expect(clean).toContain('<strong>');
      expect(clean).toContain('world');
    });

    it('should remove dangerous attributes', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('javascript:');
    });
  });

  describe('sanitizeText', () => {
    it('should remove angle brackets', () => {
      const input = 'Hello <script>alert(1)</script> world';
      const clean = sanitizeText(input);
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const input = '  Hello world  ';
      const clean = sanitizeText(input);
      expect(clean).toBe('Hello world');
    });

    it('should limit length to 5000 characters', () => {
      const input = 'a'.repeat(6000);
      const clean = sanitizeText(input);
      expect(clean.length).toBe(5000);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid http URLs', () => {
      const url = 'http://example.com';
      const clean = sanitizeUrl(url);
      expect(clean).toBe(url + '/');
    });

    it('should allow valid https URLs', () => {
      const url = 'https://example.com';
      const clean = sanitizeUrl(url);
      expect(clean).toBe(url + '/');
    });

    it('should reject javascript protocol', () => {
      const url = 'javascript:alert(1)';
      const clean = sanitizeUrl(url);
      expect(clean).toBe('');
    });

    it('should reject invalid URLs', () => {
      const url = 'not a url';
      const clean = sanitizeUrl(url);
      expect(clean).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject emails longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace special characters with underscores', () => {
      const filename = 'my file!@#$%.pdf';
      const clean = sanitizeFilename(filename);
      expect(clean).toBe('my_file_____.pdf');
    });

    it('should limit length to 255 characters', () => {
      const filename = 'a'.repeat(300) + '.pdf';
      const clean = sanitizeFilename(filename);
      expect(clean.length).toBe(255);
    });

    it('should preserve valid characters', () => {
      const filename = 'my-file_123.pdf';
      const clean = sanitizeFilename(filename);
      expect(clean).toBe(filename);
    });
  });
});
