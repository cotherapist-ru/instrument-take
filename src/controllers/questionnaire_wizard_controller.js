import { Controller } from "@hotwired/stimulus"
import { findStepElement, parseDataset } from "../helpers/dom.js"

// Generic step-by-step questionnaire wizard driven by ui_schema (yes/no, true/false/cannot say).
export default class extends Controller {
  static targets = [
    "step",
    "backButton",
    "progressText",
    "progressBar",
    "form",
    "wizard",
    "consent",
    "submitButton",
    "answerButtons"
  ]
  static values = {
    total: { type: Number, default: 1 },
    allowBack: { type: Boolean, default: false },
    autoSubmit: { type: Boolean, default: false },
    requireConsent: { type: Boolean, default: false },
    answerInteraction: { type: String, default: "radio" }
  }

  connect() {
    this.currentStep = 1
    this.formSubmitted = false
    this.boundKeydown = this.handleKeydown.bind(this)
    document.addEventListener("keydown", this.boundKeydown)
    this.syncConsentGate()
    this.render()
  }

  disconnect() {
    document.removeEventListener("keydown", this.boundKeydown)
  }

  consentChanged() {
    this.syncConsentGate()
  }

  syncConsentGate() {
    if (!this.requireConsentValue || !this.hasWizardTarget || !this.hasConsentTarget) return
    const ok = this.consentTarget.checked
    this.wizardTarget.hidden = !ok
    if (ok) {
      this.currentStep = 1
      this.render()
    }
  }

  handleKeydown(event) {
    if (event.target.closest("input:not([type=radio]):not([type=checkbox]), textarea, select")) return
    if (this.wizardHidden()) return

    if (this.allowBackValue && event.key === "ArrowLeft") {
      event.preventDefault()
      this.back()
      return
    }

    if (event.key === "ArrowRight" || (this.buttonInteraction() && event.key === "Enter")) {
      event.preventDefault()
      if (this.buttonInteraction() && this.currentStep >= this.totalValue) return
      this.next()
    }
  }

  answerChanged() {
    if (!this.radioInteraction()) return
    this.syncAnswerButtons()
    if (!this.hasAnswer()) return
    // Enable submit button / progress before auto-submit on the last step.
    if (this.currentStep >= this.totalValue) {
      this.render()
    }
    this.next()
  }

  selectAnswer(event) {
    event.preventDefault()
    if (this.wizardHidden()) return
    const answer = event.params.answer
    const stepEl = findStepElement(this.stepTargets, this.currentStep)
    if (!stepEl) return
    const radio = stepEl.querySelector(`input[type=radio][value="${answer}"]`)
    if (!radio) return

    radio.checked = true
    if (this.currentStep >= this.totalValue) {
      this.render()
    } else {
      this.next()
    }
  }

  next(event) {
    event?.preventDefault()
    if (this.wizardHidden()) return
    if (!this.hasAnswer()) return
    if (this.currentStep >= this.totalValue) {
      // Do not set formSubmitted before submit: onSubmit listens for the
      // submit event and must be able to run once; setting the flag earlier
      // caused onSubmit to preventDefault and blocked Accent final answers.
      if (this.autoSubmitValue && this.hasFormTarget && !this.formSubmitted) {
        this.submitForm()
      }
      return
    }
    this.currentStep += 1
    this.render()
  }

  back(event) {
    event?.preventDefault()
    if (!this.allowBackValue || this.currentStep <= 1) return
    this.currentStep -= 1
    this.render()
  }

  onSubmit(event) {
    if (this.wizardHidden()) {
      event.preventDefault()
      return
    }
    if (this.currentStep < this.totalValue || !this.hasAnswer()) {
      event.preventDefault()
      return
    }
    if (this.formSubmitted) {
      event.preventDefault()
      return
    }
    this.formSubmitted = true
  }

  // Wizard already enforces "current step answered"; skip HTML5 checks on hidden
  // required radios (they still fail checkValidity in Chromium) and prefer an
  // explicit submit button when present so users can retry if auto-submit stalls.
  submitForm() {
    if (!this.hasFormTarget || this.formSubmitted) return
    this.formTarget.noValidate = true
    if (this.hasSubmitButtonTarget) {
      this.submitButtonTarget.disabled = false
      this.submitButtonTarget.click()
      return
    }
    this.formTarget.requestSubmit()
  }

  hasAnswer() {
    const stepEl = findStepElement(this.stepTargets, this.currentStep)
    if (!stepEl) return false
    const name = stepEl.querySelector("input[type=radio]")?.name
    if (!name) return false
    return !!stepEl.querySelector(`input[name="${name}"]:checked`)
  }

  render() {
    this.stepTargets.forEach((el) => {
      const step = parseDataset(el, "step", "number")
      el.classList.toggle("is-hidden", step !== this.currentStep)
      el.hidden = step !== this.currentStep
    })

    if (this.hasProgressTextTarget) {
      this.progressTextTarget.textContent = this.progressLabel
    }
    if (this.hasProgressBarTarget) {
      this.progressBarTarget.value = this.currentStep
      this.progressBarTarget.max = this.totalValue
      this.progressBarTarget.setAttribute("aria-valuenow", String(this.currentStep))
      this.progressBarTarget.setAttribute("aria-valuemax", String(this.totalValue))
    }
    if (this.hasBackButtonTarget) {
      this.backButtonTarget.classList.toggle("is-hidden", this.currentStep <= 1)
      this.backButtonTarget.hidden = this.currentStep <= 1
    }

    this.syncAnswerButtons()

    if (this.hasSubmitButtonTarget) {
      const onLastStep = this.currentStep >= this.totalValue
      this.submitButtonTarget.hidden = !onLastStep
      this.submitButtonTarget.disabled = !onLastStep || !this.hasAnswer()
    }
  }

  syncAnswerButtons() {
    const stepEl = findStepElement(this.stepTargets, this.currentStep)
    if (!stepEl) return

    if (this.radioInteraction()) {
      stepEl.querySelectorAll(".questionnaire-wizard-answer-option").forEach((label) => {
        const radio = label.querySelector('input[type="radio"]')
        const selected = Boolean(radio?.checked)
        label.classList.toggle("is-primary", selected)
        label.classList.toggle("is-light", !selected)
      })
      return
    }

    const name = stepEl.querySelector("input[type=radio]")?.name
    const checkedRadio = name ? stepEl.querySelector(`input[name="${name}"]:checked`) : null
    const selectedValue = checkedRadio?.value ?? null

    stepEl.querySelectorAll("[data-questionnaire-wizard-target='answerButtons']").forEach((container) => {
      container.querySelectorAll("button[data-questionnaire-wizard-answer-param]").forEach((btn) => {
        const value = btn.dataset.questionnaireWizardAnswerParam
        btn.classList.toggle("is-primary", value === selectedValue)
        btn.classList.toggle("is-light", value !== selectedValue)
      })
    })
  }

  get progressLabel() {
    const template = this.element.querySelector("[data-questionnaire-wizard-progress-template]")
    if (template) {
      return template.textContent.replace("%{current}", this.currentStep).replace("%{total}", this.totalValue)
    }
    return `${this.currentStep} / ${this.totalValue}`
  }

  wizardHidden() {
    return this.requireConsentValue && this.hasWizardTarget && this.wizardTarget.hidden
  }

  radioInteraction() {
    return this.answerInteractionValue === "radio"
  }

  buttonInteraction() {
    return this.answerInteractionValue === "button"
  }
}
