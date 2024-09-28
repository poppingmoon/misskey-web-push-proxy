import { decodeBase64Url } from "@std/encoding";
import { Payload, verify } from "@wok/djwt";

// https://datatracker.ietf.org/doc/html/rfc8292#section-4.2
export async function validateVapid(
  authorization: string,
  vapidKey: string,
): Promise<Payload> {
  const params = authorization.substring(5).split(",").map((param) =>
    param.split("=").map((token) => token.trim())
  );
  const t = params.find((param) => param[0] === "t")?.at(1);
  const k = params.find((param) => param[0] === "k")?.at(1);
  if (t === undefined || k === undefined || k !== vapidKey) {
    throw new Error();
  }
  const key = await crypto.subtle.importKey(
    "raw",
    decodeBase64Url(k),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  return verify(t, key, {
    predicates: [
      ({ exp, aud }) =>
        exp !== undefined && aud !== undefined &&
        (exp - 60 * 60 * 24) * 1000 < Date.now(),
    ],
  });
}
