import hmacSHA512 from "crypto-js/hmac-sha512.js";

const key = "a5fb66d49ac96ab7f2efcc838d45431c493040bd6db692333133a78ef8666cb7";

export function createHmacSHA512(message) {
  return hmacSHA512(message, key).toString(); // "hex" sorgt direkt für die richtige Formatierung als Text
}
