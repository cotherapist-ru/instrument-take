import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(root, "../styles/ordered-selection.scss"), "utf8")

describe("ordered_selection portrait styles", () => {
  const required = [
    ".ordered-selection-item-grid,",
    "grid-template-columns: repeat(4, minmax(0, 1fr));",
    "overflow: clip;",
    ".ordered-selection-item-grid--szondi_mpv .ordered-selection-item__img {",
    ".ordered-selection-item-grid--szondi_orig .ordered-selection-item__img {",
    "aspect-ratio: 264 / 312;",
    "aspect-ratio: 320 / 480;",
    ".ordered-selection-item:focus-visible {",
    "box-shadow: inset 0 0 0 2px var(--app-accent-soft",
    ".ordered-selection-item.is-primary",
    ".ordered-selection-item.is-danger",
    ".button.ordered-selection-item.is-primary",
    ".button.ordered-selection-item.is-danger",
    ".ordered-selection-phase-hint {",
    ".ordered-selection-phase-hint--dislike {",
    "border-left: 4px solid var(--app-accent",
    "font-size: 1.2rem;",
    "box-shadow: inset 0 0 0 3px var(--app-accent",
    "box-shadow: inset 0 0 0 3px var(--app-feedback-danger-border",
  ]

  for (const needle of required) {
    it(`includes ${needle}`, () => {
      assert.ok(css.includes(needle), `missing ${needle}`)
    })
  }

  it("does not use expanding outer box-shadow on ranked cells", () => {
    assert.doesNotMatch(
      css,
      /\.ordered-selection-item--ranked\s*\{[^}]*box-shadow:\s*0\s+0\s+0\s+2px/
    )
  })

  it("uses inset ring (not outer shadow) for selected cells", () => {
    assert.match(
      css,
      /\.ordered-selection-item\.is-primary,[\s\S]*?box-shadow:\s*inset 0 0 0 3px var\(--app-accent/
    )
    assert.match(
      css,
      /\.ordered-selection-item\.is-danger,[\s\S]*?box-shadow:\s*inset 0 0 0 3px var\(--app-feedback-danger-border/
    )
  })

  it("phase hint is large and color-accented", () => {
    assert.match(css, /\.ordered-selection-phase-hint\s*\{[^}]*font-size:\s*1\.2rem/)
    assert.match(css, /\.ordered-selection-phase-hint\s*\{[^}]*border-left:\s*4px solid var\(--app-accent/)
    assert.match(css, /\.ordered-selection-phase-hint--dislike\s*\{[^}]*color:\s*var\(--app-feedback-danger-border/)
  })

  it("phase hint reserves height so the grid does not jump on text change", () => {
    assert.match(css, /\.ordered-selection-phase-hint\s*\{[^}]*min-height:\s*3\.25rem/)
    assert.match(css, /\.ordered-selection-phase-hint--empty\s*\{[^}]*background:\s*transparent/)
    // Rear plane hints are longer; reserve more height there so rear picks
    // do not nudge the grid.
    assert.match(css, /\.ordered-selection-phase-hint--rear\s*\{[^}]*min-height:\s*4\.5rem/)
  })

  it("mobile grid switches to two columns for larger portraits", () => {
    assert.match(
      css,
      /@media \(max-width: 640px\)[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/
    )
  })

  it("mobile form actions stick to the bottom so they stay reachable", () => {
    assert.match(
      css,
      /@media \(max-width: 640px\)[\s\S]*?\.ordered-selection-form-actions\s*\{[^}]*position:\s*sticky/
    )
  })

  it("locked procedure options are dimmed, not collapsed", () => {
    assert.match(css, /\.ordered-selection-procedure-options--locked\s*\{[^}]*opacity:\s*0\.65/)
  })

  it("puts aspect-ratio on img, not picture", () => {
    assert.doesNotMatch(css, /\.ordered-selection-item-grid--szondi_mpv\s+\.ordered-selection-item\s+picture/)
  })
})
