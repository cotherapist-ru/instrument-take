import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(
  join(root, "../src/controllers/questionnaire_wizard_controller.js"),
  "utf8"
)

describe("questionnaire_wizard auto-submit", () => {
  it("does not set formSubmitted before submit (Accent final answer)", () => {
    const nextBody = source.slice(source.indexOf("next(event)"), source.indexOf("back(event)"))
    assert.match(nextBody, /submitForm\(\)/)
    assert.doesNotMatch(
      nextBody,
      /formSubmitted\s*=\s*true[\s\S]*submitForm/,
      "setting formSubmitted before submit makes onSubmit preventDefault and blocks submit"
    )
  })

  it("marks formSubmitted inside onSubmit to guard double submit", () => {
    const start = source.indexOf("onSubmit(event)")
    const end = source.indexOf("\n  // Wizard already")
    const onSubmitBody = source.slice(start, end)
    assert.match(onSubmitBody, /this\.formSubmitted\s*=\s*true/)
  })

  it("submitForm disables native validation and prefers submit button", () => {
    const start = source.indexOf("submitForm()")
    const end = source.indexOf("\n  hasAnswer()")
    const body = source.slice(start, end)
    assert.match(body, /noValidate\s*=\s*true/)
    assert.match(body, /submitButtonTarget\.click\(\)/)
    assert.match(body, /requestSubmit\(\)/)
  })
})
