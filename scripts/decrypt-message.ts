import { decodeBase64Url } from "@std/encoding";

import { importPrivateKey } from "./import-private-key.ts";

// https://datatracker.ietf.org/doc/html/rfc8291
export async function decryptMessage({
  buffer,
  auth,
  publicKey,
  privateKey,
}: {
  buffer: ArrayBuffer;
  auth: string;
  publicKey: string;
  privateKey: string;
}): Promise<ArrayBuffer> {
  const message = new Uint8Array(buffer);
  const salt = message.slice(0, 16);
  const rs = message.slice(16, 20).reduce((acc, value) => (acc << 8) + value);
  const idlen = message.at(20)!;
  const keyid = message.slice(21, 21 + idlen);
  const ciphertext = message.slice(21 + idlen);

  const records = Array.from(
    { length: Math.ceil(ciphertext.length / rs) },
    (_, i) => ciphertext.slice(i * rs, (i + 1) * rs),
  );

  const uaPublicRaw = decodeBase64Url(publicKey);
  const uaPrivate = await importPrivateKey(uaPublicRaw, privateKey);

  const asPublicRaw = keyid;
  const asPublic = await crypto.subtle.importKey(
    "raw",
    asPublicRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const ecdhSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: asPublic },
    uaPrivate,
    256,
  );

  const prkKey = await hmacSha256(decodeBase64Url(auth).buffer, ecdhSecret);
  const webPushInfo = new TextEncoder().encode("WebPush: info");
  const keyInfo = new Uint8Array(
    webPushInfo.length + 1 + uaPublicRaw.length + asPublicRaw.length + 1,
  );
  keyInfo.set(webPushInfo);
  keyInfo.set([0], webPushInfo.length);
  keyInfo.set(uaPublicRaw, webPushInfo.length + 1);
  keyInfo.set(asPublicRaw, webPushInfo.length + 1 + uaPublicRaw.length);
  keyInfo.set([1], keyInfo.length - 1);
  const ikm = await hmacSha256(prkKey, keyInfo.buffer);

  const prk = await hmacSha256(salt.buffer, ikm);
  const contentEncodingAes128Gcm = new TextEncoder().encode(
    "Content-Encoding: aes128gcm",
  );
  const cekInfo = new Uint8Array(contentEncodingAes128Gcm.length + 2);
  cekInfo.set(contentEncodingAes128Gcm);
  cekInfo.set([0, 1], contentEncodingAes128Gcm.length);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const cek = (await crypto.subtle.sign("HMAC", hmacKey, cekInfo)).slice(0, 16);
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    cek,
    "AES-GCM",
    false,
    ["decrypt"],
  );

  const contentEncodingNonce = new TextEncoder().encode(
    "Content-Encoding: nonce",
  );
  const nonceInfo = new Uint8Array(contentEncodingNonce.length + 2);
  nonceInfo.set(contentEncodingNonce);
  nonceInfo.set([0, 1], contentEncodingNonce.length);
  const nonce = (await crypto.subtle.sign("HMAC", hmacKey, nonceInfo))
    .slice(0, 12);

  const plaintext = new Uint8Array(ciphertext.length - records.length * 17);
  await Promise.all(
    records.map(async (record, seq) => {
      const iv = new Uint8Array(nonce);
      iv.set([iv.at(11)! ^ seq], 11);
      const decriptedRecord = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        encryptionKey,
        record,
      );
      plaintext.set(
        new Uint8Array(decriptedRecord.slice(0, -1)),
        seq * (rs - 17),
      );
    }),
  );

  return plaintext.buffer;
}

async function hmacSha256(
  key: ArrayBuffer,
  input: ArrayBuffer,
): Promise<ArrayBuffer> {
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", hmacKey, input);
}
