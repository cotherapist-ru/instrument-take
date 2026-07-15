function setButtonLabel(button, label) {
  if (button.tagName === "INPUT") {
    button.value = label
    return
  }

  const labelSpan = button.querySelector(".button-label")
  if (labelSpan) {
    labelSpan.textContent = label
    return
  }

  button.textContent = label
}

export function lockSubmitButtons(buttons, { label }) {
  buttons.forEach((button) => {
    if (button.dataset.submitLoadingOriginalLabel === undefined) {
      const original =
        button.tagName === "INPUT"
          ? button.value
          : button.querySelector(".button-label")?.textContent ?? button.textContent
      button.dataset.submitLoadingOriginalLabel = original
    }

    button.disabled = true
    button.setAttribute("aria-busy", "true")
    setButtonLabel(button, label)
  })
}

export function unlockSubmitButtons(buttons) {
  buttons.forEach((button) => {
    const original = button.dataset.submitLoadingOriginalLabel
    if (original !== undefined) {
      setButtonLabel(button, original)
      delete button.dataset.submitLoadingOriginalLabel
    }

    button.disabled = false
    button.removeAttribute("aria-busy")
  })
}
