/**
 * Tiny namespaced logger. Keeps console output greppable and lets us silence
 * everything in one place for production builds.
 */

const PREFIX = '[Coffee]';
const ENABLED = true;

export const log = {
  debug: (...a) => ENABLED && console.debug(PREFIX, ...a),
  info: (...a) => ENABLED && console.info(PREFIX, ...a),
  warn: (...a) => console.warn(PREFIX, ...a),
  error: (...a) => console.error(PREFIX, ...a),
};
