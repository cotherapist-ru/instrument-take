import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(
  join(root, "../src/controllers/stimulus_wizard_controller.js"),
  "utf8"
)

describe("stimulus_wizard calibration step", () => {
  it("does not expose a dedicated acknowledge action", () => {
    assert.doesNotMatch(source, /acknowledgeA\(/)
  })

  it("marks ack panels as satisfied when shown", () => {
    const start = source.indexOf("showPanel(index)")
    const end = source.indexOf("\n  refreshPool()")
    const body = source.slice(start, end)
    assert.match(body, /step\?\.mode === "ack"/)
    assert.match(body, /this\.state\[step\.key\] = true/)
  })

  it("refreshes nav when a panel is shown", () => {
    const start = source.indexOf("showPanel(index)")
    const end = source.indexOf("\n  refreshPool()")
    const body = source.slice(start, source.indexOf("\n  updateNav()", end) + "\n  updateNav()".length)
    assert.match(body, /this\.updateNav\(\)/)
  })

  it("hides submit until the final step", () => {
    const start = source.indexOf("updateNav() {")
    const end = source.indexOf("\n}", start)
    const body = source.slice(start, end)
    assert.match(body, /submitButtonTarget\.classList\.add\("is-hidden"\)/)
    assert.match(body, /submitButtonTarget\.classList\.remove\("is-hidden"\)/)
  })
})
