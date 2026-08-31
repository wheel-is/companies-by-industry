import { PACK_KEY, PACK_PATH } from './generated/pack-meta';

const b64ToBytes = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const gunzip = async (bytes) => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Gzip decompression is not supported in this browser');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
};

export async function loadGraphData() {
  const response = await fetch(`${process.env.PUBLIC_URL}/${PACK_PATH}`);
  if (!response.ok) {
    throw new Error(`Failed to load graph data (${response.status})`);
  }

  const packed = new Uint8Array(await response.arrayBuffer());
  if (packed.length < 28) {
    throw new Error('Graph payload is invalid');
  }

  const iv = packed.slice(0, 12);
  const tag = packed.slice(12, 28);
  const ciphertext = packed.slice(28);
  const sealed = new Uint8Array(ciphertext.length + tag.length);
  sealed.set(ciphertext);
  sealed.set(tag, ciphertext.length);

  const key = await crypto.subtle.importKey(
    'raw',
    b64ToBytes(PACK_KEY),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const gzipped = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    sealed
  );
  const jsonBytes = await gunzip(gzipped);
  return JSON.parse(new TextDecoder().decode(jsonBytes));
}
