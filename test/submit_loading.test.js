import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(
  join(root, "../src/controllers/submit_loading_controller.js"),
  "utf8"
)

describe("submit_loading during form submit", () => {
  it("defers lockForm so Chromium does not cancel navigation", () => {
    const handle = source.slice(source.indexOf("handleSubmit("), source.indexOf("\n  submit("))
    assert.match(handle, /queueMicrotask\s*\(/)
    assert.match(handle, /queueMicrotask[\s\S]*this\.lockForm\(form\)/)
    // Synchronous path: add to locked set, but lockForm only inside microtask.
    const withoutMicrotask = handle.replace(/queueMicrotask\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*\)/, "")
    assert.doesNotMatch(withoutMicrotask, /this\.lockForm\(/)
  })

  it("exposes submit() for data-action aliases", () => {
    assert.match(source, /submit\s*\(_event\)/)
  })
})
