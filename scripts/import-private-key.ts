import { decodeBase64Url } from "@std/encoding";

export async function importPrivateKey(
  publicKey: string | Uint8Array<ArrayBuffer>,
  privateKey: string,
): Promise<CryptoKey> {
  const publicKeyRaw = typeof publicKey === "string"
    ? decodeBase64Url(publicKey)
    : publicKey;
  const key = await crypto.subtle.importKey(
    "raw",
    publicKeyRaw,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
  const jwk = await crypto.subtle.exportKey("jwk", key);
  jwk.d = privateKey;
  jwk.key_ops = ["deriveBits"];
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
}
