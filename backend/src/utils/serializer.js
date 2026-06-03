/**
 * Recursive utility to serialize BigInt values inside objects/arrays to standard numbers or strings.
 * This prevents "TypeError: Do not know how to serialize a BigInt" in JSON responses.
 * 
 * @param {any} obj 
 * @returns {any}
 */
export function serialize(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle BigInt
  if (typeof obj === 'bigint') {
    return Number(obj); // BigInt to standard JS number (safe for typical autoincrement IDs)
  }

  // Handle Date
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(serialize);
  }

  // Handle Objects
  if (typeof obj === 'object') {
    const serializedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serializedObj[key] = serialize(obj[key]);
      }
    }
    return serializedObj;
  }

  return obj;
}
