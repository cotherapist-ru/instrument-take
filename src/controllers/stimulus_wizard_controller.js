import { Controller } from "@hotwired/stimulus"

/**
 * Generic stimulus_wizard archetype: multi-step ranking / ack panels (luscher_full and similar).
 *
 * Contract: `static targets` / `static values` / actions must stay in sync with
 * `FormArchetypes::StimulusWizardFormComponent`.
 */
export default class extends Controller {
  static targets = [
    "form",
    "progressText",
    "nextNav",
    "backNav",
    "submitButton",
    "payloadField",
    "panel",
  ]

  static values = {
    config: String,
  }

  connect() {
    this.config = JSON.parse(this.configValue)
    this.idx = 0
    this.wizardStartedAt = Date.now()
    this.panelStartedAt = null
    this.tableTimes = {}
    this.state = {}
    this.config.forEach((c) => {
      if (c.mode === "ack") {
        this.state[c.key] = false
      } else {
        this.state[c.key] = []
      }
    })
    this.boundSubmit = this.handleSubmit.bind(this)
    this.formTarget.addEventListener("submit", this.boundSubmit)
    this.showPanel(0)
    this.panelStartedAt = Date.now()
  }

  disconnect() {
    this.formTarget.removeEventListener("submit", this.boundSubmit)
  }

  handleSubmit(event) {
    if (!this.allSatisfied()) {
      event.preventDefault()
      return
    }
    this.recordPanelDuration()
    this.payloadFieldTarget.value = JSON.stringify(this.buildPayloadWithMetadata())
  }

  pick(event) {
    event.preventDefault()
    const button = event.currentTarget
    const id = button.dataset.itemId
    if (!id) return

    const key = this.currentKey()
    const chosen = this.state[key]
    const expected = this.currentExpected()
    if (chosen.includes(id) || chosen.length >= expected) return

    chosen.push(id)
    this.refreshPool()
    this.updateNav()
  }

  undo(event) {
    event.preventDefault()
    const key = this.currentKey()
    const chosen = this.state[key]
    if (chosen.length === 0) return
    chosen.pop()
    this.refreshPool()
    this.updateNav()
  }

  resetStep(event) {
    event.preventDefault()
    const key = this.currentKey()
    this.state[key] = []
    this.refreshPool()
    this.updateNav()
  }

  goNext(event) {
    event.preventDefault()
    if (this.idx >= this.config.length - 1) return
    if (!this.currentSatisfied()) return
    this.recordPanelDuration()
    this.showPanel(this.idx + 1)
    this.panelStartedAt = Date.now()
    this.updateNav()
  }

  goBack(event) {
    event.preventDefault()
    if (this.idx <= 0) return
    this.recordPanelDuration()
    this.showPanel(this.idx - 1)
    this.panelStartedAt = Date.now()
    this.updateNav()
  }

  currentKey() {
    return this.config[this.idx].key
  }

  currentExpected() {
    return this.config[this.idx].expected
  }

  currentSatisfied() {
    const c = this.config[this.idx]
    if (c.mode === "ack") return this.state[c.key] === true
    return this.state[c.key].length === c.expected
  }

  allSatisfied() {
    return this.config.every((c) => {
      if (c.mode === "ack") return this.state[c.key] === true
      return this.state[c.key].length === c.expected
    })
  }

  buildBatteryPayload() {
    const out = {}
    this.config.forEach((c) => {
      if (c.mode === "ack") {
        out[c.key] = true
      } else {
        out[c.key] = [...this.state[c.key]]
      }
    })
    return out
  }

  buildPayloadWithMetadata() {
    const battery = this.buildBatteryPayload()
    const metadata = {
      completion_time: Math.max(0, Math.round((Date.now() - this.wizardStartedAt) / 1000)),
      calibration_passed: true,
      device_type: this.inferDeviceType(),
      table_times: { ...this.tableTimes },
    }
    return { ...battery, metadata }
  }

  recordPanelDuration() {
    if (this.panelStartedAt == null) return
    const c = this.config[this.idx]
    if (!c) return
    const sec = Math.max(0, Math.round((Date.now() - this.panelStartedAt) / 1000))
    this.tableTimes[c.key] = (this.tableTimes[c.key] || 0) + sec
  }

  inferDeviceType() {
    const ua = navigator.userAgent || ""
    if (/tablet|ipad/i.test(ua)) return "tablet"
    if (/mobile|iphone|android/i.test(ua)) return "mobile"
    return "desktop"
  }

  showPanel(index) {
    this.panelTargets.forEach((el, j) => {
      el.classList.toggle("is-hidden", j !== index)
    })
    this.idx = index
    const step = this.config[index]
    if (step?.mode === "ack") {
      this.state[step.key] = true
    }
    this.refreshPool()
    this.updateNav()
  }

  refreshPool() {
    const panel = this.panelTargets[this.idx]
    if (!panel) return
    const c = this.config[this.idx]
    if (c.mode === "ack") return

    const chosen = this.state[c.key]
    panel.querySelectorAll("[data-item-id]").forEach((btn) => {
      const id = btn.dataset.itemId
      const i = chosen.indexOf(id)
      let badge = btn.querySelector(".luscher-swatch__badge")
      if (i >= 0) {
        btn.classList.add("luscher-swatch--selected")
        if (!badge) {
          badge = document.createElement("span")
          badge.className = "luscher-swatch__badge"
          badge.setAttribute("aria-hidden", "true")
          btn.appendChild(badge)
        }
        badge.textContent = String(i + 1)
        btn.setAttribute("aria-pressed", "true")
      } else {
        btn.classList.remove("luscher-swatch--selected")
        badge?.remove()
        btn.setAttribute("aria-pressed", "false")
      }
    })
  }

  updateNav() {
    const total = this.config.length
    const template = this.progressTextTarget.dataset.progressTemplate || ""
    const text = template
      .replace("%{current}", String(this.idx + 1))
      .replace("%{total}", String(total))
    this.progressTextTarget.textContent = text

    this.backNavTarget.disabled = this.idx === 0

    const satisfied = this.currentSatisfied()
    const isLast = this.idx === this.config.length - 1

    if (isLast) {
      this.nextNavTarget.classList.add("is-hidden")
      this.submitButtonTarget.classList.remove("is-hidden")
      this.submitButtonTarget.disabled = !satisfied
    } else {
      this.nextNavTarget.classList.remove("is-hidden")
      this.nextNavTarget.disabled = !satisfied
      this.submitButtonTarget.classList.add("is-hidden")
      this.submitButtonTarget.disabled = true
    }
  }
}
