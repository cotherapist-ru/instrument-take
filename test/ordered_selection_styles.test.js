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

  it("puts aspect-ratio on img, not picture", () => {
    assert.doesNotMatch(css, /\.ordered-selection-item-grid--szondi_mpv\s+\.ordered-selection-item\s+picture/)
  })
})
