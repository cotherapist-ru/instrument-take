import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(
  join(root, "../src/controllers/ordered_selection_controller.js"),
  "utf8"
)

describe("ordered_selection portrait columns", () => {
  it("hides rear-plane cards via ordered-selection-column or column", () => {
    assert.match(
      source,
      /closest\("\.ordered-selection-column, \.column"\)/
    )
  })
})
