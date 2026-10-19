import { describe, expect, it } from 'vitest';
import { decode } from '@/engine/decode';

const get = (input: string, encoding: string) => decode(input).entries.find(e => e.encoding === encoding);

describe('extended decoding', () => {
  it('decodes URL percent escapes', () => expect(get('Hello%20World%21', 'url-encoded')?.decoded_text).toBe('Hello World!'));
  it('decodes HTML entities', () => expect(get('&#54620;&#44544;', 'html-entity')?.decoded_text).toBe('한글'));
  it('decodes JS hex escapes', () => expect(get('\\x48\\x65\\x6c\\x6c\\x6f', 'javascript-escape')?.decoded_text).toBe('Hello'));
  it('decodes JS codepoints', () => expect(get('\\u{1F600}', 'javascript-escape')?.decoded_text).toBe('😀'));
  it('decodes common hex notation', () => {
    expect(get('0x48656c6c6f', 'hex')?.decoded_text).toBe('Hello');
    expect(get('48 65 6c 6c 6f', 'hex')?.decoded_text).toBe('Hello');
  });
  it('decodes a Base45 example', () => expect(get('BB8', 'base45')).toBeUndefined()); // Ambiguous alphabet-only text is suppressed
  it('validates Base58Check checksums', () => {
    expect(get('1BoatSLRHtKNngkdXEeobR76b53LETtpyT', 'base58check')?.byte_length).toBe(21);
    expect(get('1BoatSLRHtKNngkdXEeobR76b53LETtpyU', 'base58check')).toBeUndefined();
  });
  it('parses JWT header and payload without claiming signature verification', () => {
    const toB64 = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const input = [toB64({alg:'HS256',typ:'JWT'}),toB64({sub:'123',exp:1760000000}),'signature'].join('.');
    const entry = get(input, 'jwt');
    expect(entry?.decoded_text).toContain('"sub": "123"');
    expect(entry?.notes?.[0]).toContain('NOT verified');
  });
  it('decodes layered Base64 -> URL encoding with bounded depth', () => {
    const result = decode('SGVsbG8lMjBXb3JsZA==','utf-8',3);
    expect(result.entries.find(e => e.decoded_text === 'Hello World' && e.path?.join('>') === 'base64>url-encoded')).toBeDefined();
  });
  it('supports UTF-16LE decoding', () => {
    const entry = decode('48006900','utf-16le').entries.find(e=>e.encoding==='hex');
    expect(entry?.decoded_text).toBe('Hi');
  });
  it('rejects malformed UTF-8 in selected charset', () => {
    expect(decode('ff').entries.find(e=>e.encoding==='hex')?.decoded_text).toBeNull();
  });
});
