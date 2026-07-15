import test from "node:test"
import assert from "node:assert/strict"
import { findStepElement, parseDataset } from "../src/helpers/dom.js"
import { lockSubmitButtons, unlockSubmitButtons } from "../src/helpers/submit_button.js"

test("parseDataset reads data attributes", () => {
  const el = { dataset: { step: "3" } }
  assert.equal(parseDataset(el, "step", "number"), 3)
  assert.equal(parseDataset(el, "step", "string"), "3")
  assert.equal(parseDataset(null, "step"), null)
})

test("findStepElement locates by data-step", () => {
  const targets = [
    { dataset: { step: "1" } },
    { dataset: { step: "2" } },
  ]
  assert.equal(findStepElement(targets, 2), targets[1])
  assert.equal(findStepElement(targets, 9), undefined)
})

test("lockSubmitButtons disables buttons and unlock restores", () => {
  const button = {
    tagName: "BUTTON",
    disabled: false,
    textContent: "Send",
    dataset: {},
    querySelector: () => null,
    setAttribute: () => {},
    removeAttribute: () => {},
  }
  lockSubmitButtons([button], { label: "…" })
  assert.equal(button.disabled, true)
  assert.equal(button.textContent, "…")
  unlockSubmitButtons([button])
  assert.equal(button.disabled, false)
  assert.equal(button.textContent, "Send")
})
