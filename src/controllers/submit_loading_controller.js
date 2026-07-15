import { Controller } from "@hotwired/stimulus"
import { lockSubmitButtons, unlockSubmitButtons } from "../helpers/submit_button.js"

const SUBMIT_SELECTOR = 'button[type="submit"], input[type="submit"]'

export default class extends Controller {
  static values = { label: String }

  connect() {
    this.lockedForms = new WeakSet()
    this.boundHandleSubmit = this.handleSubmit.bind(this)
    this.boundHandleSubmitEnd = this.handleSubmitEnd.bind(this)
    document.addEventListener("submit", this.boundHandleSubmit)
    document.addEventListener("turbo:submit-end", this.boundHandleSubmitEnd)
  }

  disconnect() {
    document.removeEventListener("submit", this.boundHandleSubmit)
    document.removeEventListener("turbo:submit-end", this.boundHandleSubmitEnd)
  }

  handleSubmit(event) {
    if (event.defaultPrevented) return

    const form = event.target
    if (!(form instanceof HTMLFormElement)) return
    if (form.dataset.submitLoadingOptOut !== undefined) return

    if (this.lockedForms.has(form)) {
      event.preventDefault()
      return
    }

    this.lockedForms.add(form)
    // Defer locking: synchronously disabling the clicked submit button during the
    // submit event cancels native form navigation in Chromium.
    queueMicrotask(() => {
      if (!this.lockedForms.has(form)) return
      this.lockForm(form)
    })
  }

  // Alias for data-action="submit->submit-loading#submit" (locking via document listener).
  submit(_event) {}


  handleSubmitEnd(event) {
    if (event.detail.success) return

    const form = event.target
    if (!(form instanceof HTMLFormElement)) return

    this.lockedForms.delete(form)
    this.unlockForm(form)
  }

  lockForm(form) {
    const buttons = form.querySelectorAll(SUBMIT_SELECTOR)
    if (buttons.length > 0) {
      lockSubmitButtons(buttons, { label: this.labelValue })
      return
    }

    const status = form.querySelector("[data-submit-loading-status]")
    if (!status) return

    if (status.dataset.submitLoadingOriginalLabel === undefined) {
      status.dataset.submitLoadingOriginalLabel = status.textContent
    }
    status.textContent = this.labelValue
    status.setAttribute("aria-busy", "true")
  }

  unlockForm(form) {
    const buttons = form.querySelectorAll(SUBMIT_SELECTOR)
    if (buttons.length > 0) {
      unlockSubmitButtons(buttons)
      return
    }

    const status = form.querySelector("[data-submit-loading-status]")
    if (!status) return

    const original = status.dataset.submitLoadingOriginalLabel
    if (original !== undefined) {
      status.textContent = original
      delete status.dataset.submitLoadingOriginalLabel
    }
    status.removeAttribute("aria-busy")
  }
}
