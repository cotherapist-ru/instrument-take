/**
 * DOM helpers for safe data-attribute parsing and element lookup.
 */

/**
 * Parse a data-* attribute value with type coercion.
 * @param {Element | null} el - DOM element
 * @param {string} key - camelCase key (e.g. "step" for data-step)
 * @param {'string' | 'number'} [type='string'] - desired type
 * @returns {string | number | null}
 */
export function parseDataset(el, key, type = "string") {
  const val = el?.dataset?.[key]
  if (val == null) return null
  if (type === "number") return parseInt(val, 10)
  return val
}

/**
 * Find element in targets array by data-step value.
 * @param {Element[]} targets - array of step elements
 * @param {number} step - step number to find
 * @returns {Element | undefined}
 */
export function findStepElement(targets, step) {
  return targets.find((el) => parseDataset(el, "step", "number") === step)
}
