import type { ExtraDecode } from './extra-text';
import { decodeBase58ToBytes } from './base58';

function urlBytes(segment: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(segment)) return null;
  try {
    const core = segment.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(core + '='.repeat((4 - core.length % 4) % 4));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  } catch { return null; }
}
function utf8(data: Uint8Array): string | null {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(data); } catch { return null; }
}
export function decodeJwt(input: string): ExtraDecode | null {
  const segments = input.split('.');
  if (segments.length !== 3 || segments[0].length < 2 || segments[1].length < 2 || segments[2].length > 2048) return null;
  const head = urlBytes(segments[0]), body = urlBytes(segments[1]);
  if (!head || !body) return null;
  const h = utf8(head), p = utf8(body);
  if (!h || !p) return null;
  try {
    const header: unknown = JSON.parse(h), payload: unknown = JSON.parse(p);
    if (!header || typeof header !== 'object' || Array.isArray(header) || !('alg' in header) ||
        !payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const times: Record<string, string> = {};
    for (const field of ['iat','nbf','exp']) {
      const value = (payload as Record<string, unknown>)[field];
      if (typeof value === 'number' && Number.isFinite(value)) {
        const date = new Date(value * 1000);
        if (!Number.isNaN(date.valueOf())) times[field] = date.toISOString();
      }
    }
    return {
      encoding: 'jwt',
      bytes: new TextEncoder().encode(JSON.stringify({ header, payload, timestamps: times }, null, 2)),
      notes: ['JWT signature NOT verified; claims are untrusted'],
    };
  } catch { return null; }
}

// Minimal synchronous SHA-256 (FIPS 180-4), for the Bitcoin Base58Check checksum.
const K = [
0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
];
function rot(x: number, n: number): number { return (x >>> n) | (x << (32 - n)); }
function sha256(input: Uint8Array): Uint8Array {
  const size = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(size);
  padded.set(input); padded[input.length] = 128;
  const view = new DataView(padded.buffer), bits = BigInt(input.length) * 8n;
  view.setUint32(size - 8, Number(bits >> 32n)); view.setUint32(size - 4, Number(bits & 0xffffffffn));
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  for (let offset=0;offset<size;offset+=64) {
    const w = new Uint32Array(64);
    for(let i=0;i<16;i++) w[i]=view.getUint32(offset+i*4);
    for(let i=16;i<64;i++) {
      const x=w[i-15],y=w[i-2];
      w[i]=(w[i-16]+(rot(x,7)^rot(x,18)^(x>>>3))+w[i-7]+(rot(y,17)^rot(y,19)^(y>>>10)))>>>0;
    }
    let [a,b,c,d,e,f,g,z]=h;
    for(let i=0;i<64;i++) {
      const t1=(z+(rot(e,6)^rot(e,11)^rot(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0;
      const t2=((rot(a,2)^rot(a,13)^rot(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
      z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    [a,b,c,d,e,f,g,z].forEach((x,i)=>{h[i]=(h[i]+x)>>>0;});
  }
  const out=new Uint8Array(32),v=new DataView(out.buffer);
  h.forEach((x,i)=>v.setUint32(i*4,x));
  return out;
}
export function decodeBase58Check(input: string): ExtraDecode | null {
  if (!/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{5,}$/.test(input)) return null;
  const all = decodeBase58ToBytes(input);
  if (!all || all.length < 5 || all.length > 100) return null;
  const data = all.slice(0,-4), check=sha256(sha256(data));
  for(let i=0;i<4;i++) if(check[i]!==all[all.length-4+i]) return null;
  return { encoding:'base58check', bytes:data, notes:['Double SHA-256 checksum verified'] };
}
