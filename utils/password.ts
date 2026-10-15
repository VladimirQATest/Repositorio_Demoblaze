/**
 * Replicates the app's client-side password encoding.
 *
 * The DemoBlaze JS defines `b64EncodeUnicode(str)` as:
 *   btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
 *        (match, p1) => String.fromCharCode('0x' + p1)))
 *
 * i.e. UTF-8-safe base64. Must be used when sending passwords to the API
 * (POST /login and POST /signup).
 */
export function b64EncodeUnicode(str: string): string {
  const binary = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1: string) =>
    String.fromCharCode(parseInt(p1, 16)),
  );
  return Buffer.from(binary, 'binary').toString('base64');
}
