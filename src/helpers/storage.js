/**
 * localStorage wrapper with safe get/set.
 */

/**
 * @param {string} key
 * @param {string | null} [defaultValue=null]
 * @returns {string | null}
 */
export function getStorage(key, defaultValue = null) {
  try {
    const val = localStorage.getItem(key)
    return val ?? defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {boolean}
 */
export function setStorage(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} key
 * @returns {void}
 */
export function removeStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
