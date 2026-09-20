import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import assert from "node:assert/strict"
import test from "node:test"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))

test("package is scoped to the GitHub org and publishes to GitHub Packages", () => {
  assert.equal(pkg.name, "@cotherapist-ru/instrument-take")
  assert.equal(pkg.publishConfig?.registry, "https://npm.pkg.github.com")
  assert.equal(pkg.publishConfig?.access, "restricted")
  assert.match(pkg.repository?.url ?? "", /github\.com\/cotherapist-ru\/instrument-take/)
})
