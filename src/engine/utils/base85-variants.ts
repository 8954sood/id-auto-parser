import type { ExtraDecode } from './extra-text';

const PYTHON_B85 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_\u0060{|}~';
const Z85 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';
const ASCII85 = Array.from({ length: 85 }, (_, i) => String.fromCharCode(33 + i)).join('');

function blocks(input: string, alphabet: string, partial: boolean): Uint8Array | null {
  if (input.length === 0 || (!partial && input.length % 5 !== 0) || input.length % 5 === 1) return null;
  const output: number[] = [];
  for (let i = 0; i < input.length; i += 5) {
    const chunk = input.slice(i, i + 5);
    let n = 0;
    for (const ch of chunk) {
      const digit = alphabet.indexOf(ch);
      if (digit < 0) return null;
      n = n * 85 + digit;
    }
    for (let k = chunk.length; k < 5; k++) n = n * 85 + 84;
    if (n > 0xffffffff) return null;
    const word = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    output.push(...word.slice(0, chunk.length === 5 ? 4 : chunk.length - 1));
  }
  return Uint8Array.from(output);
}

function ascii85(input: string): ExtraDecode | null {
  const framed = input.startsWith('<~') && input.endsWith('~>');
  const body = (framed ? input.slice(2, -2) : input).replace(/\s/g, '');
  // Raw Ascii85 is easily confused with arbitrary text: demand a signal.
  if (!framed && (body.length < 5 || !/[^a-zA-Z0-9]/.test(body))) return null;
  const data: number[] = [];
  let pending = '';
  const flush = (): boolean => {
    if (pending.length < 2) return false;
    const decoded = blocks(pending, ASCII85, true);
    if (!decoded) return false;
    data.push(...decoded);
    pending = '';
    return true;
  };
  for (const ch of body) {
    if (ch === 'z') {
      if (pending) return null;
      data.push(0, 0, 0, 0);
    } else {
      if (ch < '!' || ch > 'u') return null;
      pending += ch;
      if (pending.length === 5 && !flush()) return null;
    }
  }
  if (pending && !flush()) return null;
  return data.length > 0 ? { encoding: 'ascii85', bytes: Uint8Array.from(data) } : null;
}

export function decodeBase85Variants(input: string): ExtraDecode[] {
  const result: ExtraDecode[] = [];
  const ascii = ascii85(input);
  if (ascii) result.push(ascii);
  if (input.length >= 5 && /[^a-zA-Z0-9]/.test(input)) {
    const python = blocks(input, PYTHON_B85, true);
    if (python) result.push({ encoding: 'base85', bytes: python });
  }
  if (input.length >= 5 && input.length % 5 === 0) {
    const zmq = blocks(input, Z85, false);
    if (zmq) result.push({ encoding: 'z85', bytes: zmq });
  }
  return result;
}
