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

  it("toggles dislike modifier on phaseHint during dislike phases", () => {
    assert.match(
      source,
      /ordered-selection-phase-hint--dislike/
    )
    assert.match(
      source,
      /this\.phaseIndex\s*>=\s*this\.selectionsPerPoleValue/
    )
    // Empty hint stays in flow (reserved min-height in CSS) so the grid below
    // does not jump on every pick.
    assert.match(
      source,
      /classList\.toggle\("ordered-selection-phase-hint--empty",\s*!hint\)/
    )
    // Rear plane reserves a taller slot (longer hints) — toggled per plane.
    assert.match(
      source,
      /classList\.toggle\(\s*"ordered-selection-phase-hint--rear",\s*this\.plane\s*===\s*"rear"\s*\)/
    )
    assert.doesNotMatch(
      source,
      /classList\.toggle\("is-hidden",\s*!hint\)/
    )
  })

  it("exposes procedureLocked and initialProcedureMode values", () => {
    assert.match(
      source,
      /procedureLocked:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\}/
    )
    assert.match(
      source,
      /initialProcedureMode:\s*\{\s*type:\s*String,\s*default:\s*"discrete"\s*\}/
    )
    assert.match(source, /procedureFieldset/)
  })

  it("locks the procedure toggle after the first portrait pick", () => {
    assert.match(source, /lockProcedureAfterPick\(\)/)
    assert.match(
      source,
      /this\.procedureLocked\s*=\s*true/
    )
    // Lock dims the radios but does NOT collapse the fieldset — collapsing it
    // shifts the portrait grid on the first pick.
    assert.match(
      source,
      /classList\.add\("ordered-selection-procedure-options--locked"\)/
    )
    assert.doesNotMatch(
      source,
      /this\.procedureFieldsetTarget\.classList\.add\("is-hidden"\)/
    )
  })

  it("makes setProcedureMode a no-op once locked", () => {
    assert.match(
      source,
      /setProcedureMode\(event\)\s*\{\s*if\s*\(this\.procedureLocked\)\s*return/
    )
  })

  it("respects a locked preference when connecting", () => {
    assert.match(
      source,
      /if\s*\(this\.procedureLockedValue\)\s*\{[\s\S]*?return\s+locked\s*\}/
    )
  })
})
