import { Controller } from "@hotwired/stimulus"

/**
 * Generic ordered_selection archetype: portrait ranking (Szondi) or swatch ranking (Lüscher quick).
 *
 * Contract: `static targets` / `static values` / actions must stay in sync with
 * `FormArchetypes::OrderedSelectionFormComponent`.
 */
export default class extends Controller {
  static targets = [
    "form",
    "seriesLabel",
    "planeLabel",
    "phaseHint",
    "portraitGrid",
    "portrait",
    "hiddenFrontLike",
    "hiddenFrontDislike",
    "hiddenRearLike",
    "hiddenRearDislike",
    "hiddenFrontRanking",
    "hiddenRearRanking",
    "hiddenProcedure",
    "rankingStrip",
    "submitBtn",
    "metadataField",
    "phase1Panel",
    "phase2Panel",
    "phase1Pool",
    "phase2Pool",
    "nextPhaseButton",
    "submitButton",
    "progressText",
  ]

  static values = {
    mode: { type: String, default: "swatch" },
    like1Hint: String,
    like2Hint: String,
    dislike1Hint: String,
    dislike2Hint: String,
    rearLike1Hint: String,
    rearLike2Hint: String,
    rearDislike1Hint: String,
    rearDislike2Hint: String,
    continuumFrontHint: String,
    continuumRearHint: String,
    planeFront: String,
    planeRear: String,
    rankingEmpty: String,
    /** @type {number} */
    seriesCount: { type: Number, default: 6 },
    /** @type {number} */
    slotCount: { type: Number, default: 8 },
    /** @type {number} */
    frontRankingSize: { type: Number, default: 8 },
    /** @type {number} */
    rearRankingSize: { type: Number, default: 4 },
    /** @type {number} */
    selectionsPerPole: { type: Number, default: 2 },
    /** @type {number} */
    selectionCount: { type: Number, default: 8 },
    /** @type {string[][]} */
    portraits: { type: Array, default: [] },
    /** @type {string[][]} */
    portraitWebps: { type: Array, default: [] },
    unpickedLabelTemplate: String,
    pickedLabelTemplate: String,
    progressTemplate: String,
  }

  connect() {
    if (this.portraitMode()) {
      this.connectPortrait()
    } else {
      this.connectSwatch()
    }
  }

  disconnect() {
    if (!this.portraitMode() && this.hasFormTarget && this.boundSubmit) {
      this.formTarget.removeEventListener("submit", this.boundSubmit)
    }
  }

  portraitMode() {
    return this.modeValue === "portrait"
  }

  // —— Portrait (Szondi) ——————————————————————————————————————————————————————

  connectPortrait() {
    this.plane = "front"
    this.series = 1
    this.phaseIndex = 0
    this.likes = []
    this.dislikes = []
    this.ranking = []
    this.procedureMode = this.readProcedureMode()
    this.syncProcedureHidden()
    this.refreshPlaneLabel()
    this.refreshPhase()
  }

  discretePhaseCount() {
    return this.selectionsPerPoleValue * 2
  }

  lastSeries() {
    return this.seriesCountValue
  }

  allSlots() {
    return Array.from({ length: this.slotCountValue }, (_, index) => index + 1)
  }

  readProcedureMode() {
    if (!this.hasHiddenProcedureTarget) return "discrete"
    const value = this.hiddenProcedureTarget.value
    return value === "continuum" ? "continuum" : "discrete"
  }

  setProcedureMode(event) {
    const mode = event.target.value
    if (mode === this.procedureMode) return
    this.procedureMode = mode
    this.resetWizardState()
    this.syncProcedureHidden()
    this.refreshPhase()
  }

  resetWizardState() {
    this.plane = "front"
    this.series = 1
    this.phaseIndex = 0
    this.likes = []
    this.dislikes = []
    this.ranking = []
    this.clearAllHiddenFields()
    if (this.hasSubmitBtnTarget) this.submitBtnTarget.disabled = true
  }

  continuumMode() {
    return this.procedureMode === "continuum"
  }

  refreshPlaneLabel() {
    if (!this.hasPlaneLabelTarget) return
    const text = this.plane === "front" ? this.planeFrontValue : this.planeRearValue
    this.planeLabelTarget.textContent = text || ""
  }

  refreshPhase() {
    if (!this.portraitMode()) return

    if (this.hasSeriesLabelTarget) {
      this.seriesLabelTarget.textContent = String(this.series)
    }
    this.refreshPlaneLabel()
    this.refreshPhaseHint()
    this.refreshRankingStrip()

    const finished = this.plane === "rear" && this.series === this.lastSeries() && this.phaseIndex >= this.discretePhaseCount()
    const neutral = this.plane === "rear" ? this.neutralSlotsForSeries(this.series) : null

    if (this.hasPortraitGridTarget) {
      this.portraitGridTarget.classList.toggle(
        "ordered-selection-item-grid--rear",
        this.plane === "rear"
      )
      this.portraitGridTarget.classList.toggle(
        "ordered-selection-item-grid--continuum",
        this.continuumMode()
      )
    }

    this.portraitTargets.forEach((btn) => {
      const slot = parseInt(btn.dataset.slot, 10)
      const col =
        btn.closest(".ordered-selection-column, .column") || btn.parentElement
      if (col) {
        const hide =
          this.plane === "rear" && Array.isArray(neutral) && !neutral.includes(slot)
        col.classList.toggle("is-hidden", hide)
        col.hidden = hide
      }

      btn.classList.remove("has-background-grey-lighter", "is-outlined")

      const rankIndex = this.ranking.indexOf(slot)
      const rankBadge = btn.querySelector("[data-rank-badge]")
      if (rankBadge) {
        if (rankIndex >= 0) {
          rankBadge.textContent = String(rankIndex + 1)
          rankBadge.classList.remove("is-hidden")
        } else {
          rankBadge.textContent = ""
          rankBadge.classList.add("is-hidden")
        }
      }

      const disabled = finished || this.isSlotDisabled(slot, neutral)
      btn.disabled = disabled
      btn.classList.toggle("is-primary", this.likes.includes(slot))
      btn.classList.toggle("is-danger", this.dislikes.includes(slot))
      btn.classList.toggle("ordered-selection-item--ranked", rankIndex >= 0)
      btn.setAttribute(
        "aria-pressed",
        this.likes.includes(slot) || this.dislikes.includes(slot) || rankIndex >= 0 ? "true" : "false"
      )
    })

    this.syncPortraitImages()

    if (this.hasSubmitBtnTarget) {
      this.submitBtnTarget.disabled = !finished
    }
  }

  refreshPhaseHint() {
    if (!this.hasPhaseHintTarget) return

    if (this.continuumMode()) {
      const hint = this.plane === "rear" ? this.continuumRearHintValue : this.continuumFrontHintValue
      this.phaseHintTarget.textContent = hint || ""
      return
    }

    const frontHints = [
      this.like1HintValue,
      this.like2HintValue,
      this.dislike1HintValue,
      this.dislike2HintValue,
    ]
    const rearHints = [
      this.rearLike1HintValue,
      this.rearLike2HintValue,
      this.rearDislike1HintValue,
      this.rearDislike2HintValue,
    ]
    const hints = this.plane === "front" ? frontHints : rearHints
    this.phaseHintTarget.textContent = hints[this.phaseIndex] || ""
  }

  refreshRankingStrip() {
    if (!this.hasRankingStripTarget) return

    if (!this.continuumMode()) {
      this.rankingStripTarget.textContent = ""
      this.rankingStripTarget.classList.add("is-hidden")
      return
    }

    this.rankingStripTarget.classList.remove("is-hidden")
    if (this.ranking.length === 0) {
      this.rankingStripTarget.textContent = this.rankingEmptyValue || ""
      return
    }

    this.rankingStripTarget.textContent = this.ranking.join(" → ")
  }

  syncPortraitImages() {
    let rows
    try {
      rows = this.portraitsValue
    } catch {
      return
    }
    if (!Array.isArray(rows) || rows.length === 0) return

    const row = rows[this.series - 1]
    if (!Array.isArray(row) || row.length === 0) return

    let webpRows = []
    try {
      webpRows = this.hasPortraitWebpsValue ? this.portraitWebpsValue : []
    } catch {
      webpRows = []
    }
    const webpRow = Array.isArray(webpRows) ? webpRows[this.series - 1] : null

    this.portraitTargets.forEach((btn) => {
      const slot = parseInt(btn.dataset.slot, 10)
      if (Number.isNaN(slot)) return
      const src = row[slot - 1]
      const img = btn.querySelector("img")
      if (img && src && img.getAttribute("src") !== src) img.setAttribute("src", src)

      const source = btn.querySelector('source[type="image/webp"]')
      const webpSrc = Array.isArray(webpRow) ? webpRow[slot - 1] : null
      if (source && webpSrc && source.getAttribute("srcset") !== webpSrc) {
        source.setAttribute("srcset", webpSrc)
      }
    })

    this.preloadNextSeries()
  }

  preloadNextSeries() {
    const rows = this.portraitsValue
    const next = rows[this.series]
    if (Array.isArray(next)) next.forEach((src) => this.preloadImage(src))

    if (this.hasPortraitWebpsValue) {
      const webpRows = this.portraitWebpsValue
      const nextWebp = webpRows[this.series]
      if (Array.isArray(nextWebp)) nextWebp.forEach((src) => this.preloadImage(src))
    }
  }

  preloadImage(src) {
    if (!src) return
    if (!this._preloaded) this._preloaded = new Set()
    if (this._preloaded.has(src)) return

    const img = new Image()
    img.src = src
    this._preloaded.add(src)
  }

  neutralSlotsForSeries(series) {
    const likeHidden = this.hiddenFrontLikeTargets.filter(
      (el) => parseInt(el.dataset.series, 10) === series
    )
    const dislikeHidden = this.hiddenFrontDislikeTargets.filter(
      (el) => parseInt(el.dataset.series, 10) === series
    )
    const likes = likeHidden
      .map((el) => parseInt(el.value, 10))
      .filter((n) => !Number.isNaN(n) && n >= 1)
    const dislikes = dislikeHidden
      .map((el) => parseInt(el.value, 10))
      .filter((n) => !Number.isNaN(n) && n >= 1)
    const used = new Set([...likes, ...dislikes])
    return this.allSlots().filter((n) => !used.has(n))
  }

  rankingTargetSize() {
    if (this.plane === "rear") return this.rearRankingSizeValue
    return this.frontRankingSizeValue
  }

  isSlotDisabled(slot, neutral) {
    if (this.continuumMode()) {
      if (this.plane === "rear") {
        if (!neutral || !neutral.includes(slot)) return true
        return this.ranking.includes(slot)
      }
      return this.ranking.includes(slot)
    }

    if (this.plane === "rear") {
      if (!neutral || !neutral.includes(slot)) return true
      if (this.phaseIndex >= this.selectionsPerPoleValue) return true
      return this.likes.includes(slot)
    }
    if (this.phaseIndex < this.selectionsPerPoleValue) return this.likes.includes(slot)
    if (this.likes.includes(slot)) return true
    return this.dislikes.includes(slot)
  }

  pick(event) {
    if (this.portraitMode()) {
      this.pickPortrait(event)
    } else {
      this.pickSwatch(event)
    }
  }

  pickPortrait(event) {
    if (this.plane === "rear" && this.series === this.lastSeries() && this.phaseIndex >= this.discretePhaseCount()) return

    const slot = parseInt(event.currentTarget.dataset.slot, 10)
    if (Number.isNaN(slot)) return

    if (this.continuumMode()) {
      this.pickContinuum(slot)
      return
    }

    this.pickDiscrete(slot)
  }

  pickContinuum(slot) {
    const max = this.rankingTargetSize()
    if (this.ranking.includes(slot)) return

    this.ranking.push(slot)
    if (this.ranking.length < max) {
      this.refreshPhase()
      return
    }

    this.likes = [...this.ranking.slice(0, this.selectionsPerPoleValue)]
    this.dislikes = [...this.ranking.slice(-this.selectionsPerPoleValue)]
    this.phaseIndex = this.discretePhaseCount()
    this.flushSeriesToHidden()
    this.advanceAfterSeriesFlush()
    this.ranking = []
    this.refreshPhase()
  }

  pickDiscrete(slot) {
    if (this.phaseIndex < this.selectionsPerPoleValue) {
      if (this.likes.includes(slot)) return
      this.likes.push(slot)

      if (this.plane === "rear" && this.likes.length === this.selectionsPerPoleValue) {
        const neutral = this.neutralSlotsForSeries(this.series)
        const autoDislikes = neutral.filter((n) => !this.likes.includes(n)).sort((a, b) => a - b)
        this.dislikes = autoDislikes
        this.phaseIndex = this.discretePhaseCount()
        this.flushSeriesToHidden()
        this.advanceAfterSeriesFlush()
        this.refreshPhase()
        return
      }

      this.phaseIndex += 1
    } else {
      if (this.likes.includes(slot) || this.dislikes.includes(slot)) return
      this.dislikes.push(slot)
      this.phaseIndex += 1
    }

    if (this.phaseIndex === this.discretePhaseCount()) {
      this.flushSeriesToHidden()
      this.advanceAfterSeriesFlush()
    }
    this.refreshPhase()
  }

  advanceAfterSeriesFlush() {
    if (this.plane === "front") {
      if (this.series === this.lastSeries()) {
        this.plane = "rear"
        this.series = 1
        this.phaseIndex = 0
        this.likes = []
        this.dislikes = []
        this.ranking = []
      } else {
        this.series += 1
        this.phaseIndex = 0
        this.likes = []
        this.dislikes = []
        this.ranking = []
      }
    } else if (this.series === this.lastSeries()) {
      return
    } else {
      this.series += 1
      this.phaseIndex = 0
      this.likes = []
      this.dislikes = []
      this.ranking = []
    }
  }

  flushSeriesToHidden() {
    const s = this.series
    if (this.plane === "rear") {
      const likeHidden = this.hiddenRearLikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      const dislikeHidden = this.hiddenRearDislikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      ;[...this.likes].sort((a, b) => a - b).forEach((val, i) => {
        if (likeHidden[i]) likeHidden[i].value = String(val)
      })
      ;[...this.dislikes].sort((a, b) => a - b).forEach((val, i) => {
        if (dislikeHidden[i]) dislikeHidden[i].value = String(val)
      })
      if (this.continuumMode() && this.hasHiddenRearRankingTarget) {
        const rankingHidden = this.hiddenRearRankingTargets.filter(
          (el) => parseInt(el.dataset.series, 10) === s
        )
        const ordered = this.orderedRankingForFlush()
        ordered.forEach((val, i) => {
          if (rankingHidden[i]) rankingHidden[i].value = String(val)
        })
      }
    } else {
      const likeHidden = this.hiddenFrontLikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      const dislikeHidden = this.hiddenFrontDislikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      ;[...this.likes].sort((a, b) => a - b).forEach((val, i) => {
        if (likeHidden[i]) likeHidden[i].value = String(val)
      })
      ;[...this.dislikes].sort((a, b) => a - b).forEach((val, i) => {
        if (dislikeHidden[i]) dislikeHidden[i].value = String(val)
      })
      if (this.continuumMode() && this.hasHiddenFrontRankingTarget) {
        const rankingHidden = this.hiddenFrontRankingTargets.filter(
          (el) => parseInt(el.dataset.series, 10) === s
        )
        const ordered = this.orderedRankingForFlush()
        ordered.forEach((val, i) => {
          if (rankingHidden[i]) rankingHidden[i].value = String(val)
        })
      }
    }
  }

  orderedRankingForFlush() {
    if (this.ranking.length > 0) return [...this.ranking]
    return [...this.likes, ...this.dislikes].length > 0
      ? [...this.likes, ...this.dislikes]
      : []
  }

  clearRearHiddenForSeries(series) {
    const s = series
    this.hiddenRearLikeTargets
      .filter((el) => parseInt(el.dataset.series, 10) === s)
      .forEach((el) => {
        el.value = ""
      })
    this.hiddenRearDislikeTargets
      .filter((el) => parseInt(el.dataset.series, 10) === s)
      .forEach((el) => {
        el.value = ""
      })
    if (this.hasHiddenRearRankingTarget) {
      this.hiddenRearRankingTargets
        .filter((el) => parseInt(el.dataset.series, 10) === s)
        .forEach((el) => {
          el.value = ""
        })
    }
  }

  clearFrontHiddenForSeries(series) {
    const s = series
    this.hiddenFrontLikeTargets
      .filter((el) => parseInt(el.dataset.series, 10) === s)
      .forEach((el) => {
        el.value = ""
      })
    this.hiddenFrontDislikeTargets
      .filter((el) => parseInt(el.dataset.series, 10) === s)
      .forEach((el) => {
        el.value = ""
      })
    if (this.hasHiddenFrontRankingTarget) {
      this.hiddenFrontRankingTargets
        .filter((el) => parseInt(el.dataset.series, 10) === s)
        .forEach((el) => {
          el.value = ""
        })
    }
  }

  clearAllHiddenFields() {
    for (let s = 1; s <= this.lastSeries(); s += 1) {
      this.clearFrontHiddenForSeries(s)
      this.clearRearHiddenForSeries(s)
    }
  }

  syncProcedureHidden() {
    if (this.hasHiddenProcedureTarget) {
      this.hiddenProcedureTarget.value = this.procedureMode
    }
  }

  undo(event) {
    if (this.portraitMode()) {
      this.undoPortrait()
      return
    }
    event?.preventDefault()
    this.undoSwatch()
  }

  undoPortrait() {
    const rearDone = this.plane === "rear" && this.series === this.lastSeries() && this.phaseIndex >= this.discretePhaseCount()
    if (rearDone) {
      this.phaseIndex = 0
      this.likes = []
      this.dislikes = []
      this.ranking = []
      this.clearRearHiddenForSeries(this.series)
      if (this.hasSubmitBtnTarget) this.submitBtnTarget.disabled = true
      this.refreshPhase()
      return
    }

    if (this.continuumMode() && this.ranking.length > 0) {
      this.ranking.pop()
      this.refreshPhase()
      return
    }

    if (this.phaseIndex > 0) {
      this.phaseIndex -= 1
      if (this.phaseIndex < this.selectionsPerPoleValue) {
        this.likes.pop()
      } else {
        this.dislikes.pop()
      }
    } else if (this.plane === "rear" && this.series === 1) {
      this.plane = "front"
      this.series = this.lastSeries()
      this.readSeriesFromHidden()
      this.phaseIndex = this.discretePhaseCount() - 1
      this.dislikes.pop()
      this.clearRearHiddenForSeries(1)
    } else if (this.plane === "rear" && this.series > 1) {
      this.series -= 1
      this.likes = []
      this.dislikes = []
      this.ranking = []
      this.clearRearHiddenForSeries(this.series + 1)
      this.phaseIndex = 0
    } else if (this.plane === "front" && this.series > 1) {
      this.series -= 1
      this.readSeriesFromHidden()
      this.phaseIndex = this.discretePhaseCount() - 1
      this.dislikes.pop()
    }
    this.refreshPhase()
  }

  readSeriesFromHidden() {
    const s = this.series
    if (this.plane === "rear") {
      const likeHidden = this.hiddenRearLikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      const dislikeHidden = this.hiddenRearDislikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      this.likes = likeHidden
        .map((el) => parseInt(el.value, 10))
        .filter((n) => !Number.isNaN(n))
      this.dislikes = dislikeHidden
        .map((el) => parseInt(el.value, 10))
        .filter((n) => !Number.isNaN(n))
    } else {
      const likeHidden = this.hiddenFrontLikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      const dislikeHidden = this.hiddenFrontDislikeTargets.filter(
        (el) => parseInt(el.dataset.series, 10) === s
      )
      this.likes = likeHidden
        .map((el) => parseInt(el.value, 10))
        .filter((n) => !Number.isNaN(n))
      this.dislikes = dislikeHidden
        .map((el) => parseInt(el.value, 10))
        .filter((n) => !Number.isNaN(n))
    }
  }

  // —— Swatch (Lüscher quick) ————————————————————————————————————————————————

  connectSwatch() {
    this.startedAt = Date.now()
    this.phase1Chosen = []
    this.phase2Chosen = []
    this.boundSubmit = this.handleSubmit.bind(this)
    this.formTarget.addEventListener("submit", this.boundSubmit)
    this.refreshSwatchPhase(1)
    this.refreshSwatchPhase(2)
    this.updateSwatchActions()
  }

  handleSubmit() {
    this.clearPhaseInputs()
    this.phase1Chosen.forEach((color) => this.appendHidden("phase1_order", color))
    this.phase2Chosen.forEach((color) => this.appendHidden("phase2_order", color))
    this.writeMetadataField()
  }

  writeMetadataField() {
    if (!this.hasMetadataFieldTarget) return
    const elapsed = Math.max(0, Math.round((Date.now() - this.startedAt) / 1000))
    const meta = {
      completion_time: elapsed,
      device_type: this.inferDeviceType(),
      calibration_passed: true,
    }
    this.metadataFieldTarget.value = JSON.stringify(meta)
  }

  inferDeviceType() {
    const ua = navigator.userAgent || ""
    if (/tablet|ipad/i.test(ua)) return "tablet"
    if (/mobile|iphone|android/i.test(ua)) return "mobile"
    return "desktop"
  }

  clearPhaseInputs() {
    this.formTarget
      .querySelectorAll("input[name='phase1_order[]'], input[name='phase2_order[]']")
      .forEach((el) => el.remove())
  }

  appendHidden(name, value) {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = `${name}[]`
    input.value = value
    this.formTarget.appendChild(input)
  }

  pickSwatch(event) {
    const button = event.currentTarget
    const code = button.dataset.color
    if (!code) return

    const phase = this.activeSwatchPhase()
    const chosen = phase === 2 ? this.phase2Chosen : this.phase1Chosen
    const max = this.selectionCountValue
    if (chosen.includes(code) || chosen.length >= max) return

    chosen.push(code)
    this.refreshSwatchPhase(phase)
    this.updateSwatchActions()
  }

  undoSwatch() {
    const phase = this.activeSwatchPhase()
    const chosen = phase === 2 ? this.phase2Chosen : this.phase1Chosen
    if (chosen.length === 0) return
    chosen.pop()
    this.refreshSwatchPhase(phase)
    this.updateSwatchActions()
  }

  resetPhase(event) {
    event.preventDefault()
    const phase = this.activeSwatchPhase()
    if (phase === 1) {
      this.phase1Chosen = []
    } else {
      this.phase2Chosen = []
    }
    this.refreshSwatchPhase(phase)
    this.updateSwatchActions()
  }

  showPhase2() {
    const max = this.selectionCountValue
    if (this.phase1Chosen.length !== max) return
    this.phase1PanelTarget.classList.add("is-hidden")
    this.phase2PanelTarget.classList.remove("is-hidden")
    this.phase2Chosen = []
    this.refreshSwatchPhase(2)
    this.updateSwatchActions()
  }

  activeSwatchPhase() {
    return this.phase2PanelTarget.classList.contains("is-hidden") ? 1 : 2
  }

  refreshSwatchPhase(phase) {
    const pool = phase === 2 ? this.phase2PoolTarget : this.phase1PoolTarget
    const chosen = phase === 2 ? this.phase2Chosen : this.phase1Chosen
    pool.querySelectorAll("[data-color]").forEach((btn) => this.syncSwatch(btn, chosen))
  }

  syncSwatch(button, chosen) {
    const code = button.dataset.color
    const name = button.dataset.colorName || code
    const idx = chosen.indexOf(code)
    let badge = button.querySelector(".luscher-swatch__badge")

    if (idx >= 0) {
      button.classList.add("luscher-swatch--selected")
      if (!badge) {
        badge = document.createElement("span")
        badge.className = "luscher-swatch__badge"
        badge.setAttribute("aria-hidden", "true")
        button.appendChild(badge)
      }
      badge.textContent = String(idx + 1)
      button.setAttribute("aria-pressed", "true")
      button.setAttribute(
        "aria-label",
        this.pickedLabelTemplateValue.replace("%{name}", name).replace("%{position}", String(idx + 1))
      )
    } else {
      button.classList.remove("luscher-swatch--selected")
      badge?.remove()
      button.setAttribute("aria-pressed", "false")
      button.setAttribute(
        "aria-label",
        this.unpickedLabelTemplateValue.replace("%{name}", name)
      )
    }
  }

  updateSwatchActions() {
    const max = this.selectionCountValue
    const p1 = this.phase1Chosen.length === max
    const p2 = this.phase2Chosen.length === max

    if (this.hasNextPhaseButtonTarget) {
      this.nextPhaseButtonTarget.disabled = !p1
    }
    if (this.hasSubmitButtonTarget) {
      this.submitButtonTarget.disabled = !p2
    }
    this.updateSwatchProgress()
  }

  updateSwatchProgress() {
    if (!this.hasProgressTextTarget) return
    const phase = this.activeSwatchPhase()
    const n = phase === 2 ? this.phase2Chosen.length : this.phase1Chosen.length
    const total = String(this.selectionCountValue)
    const text = this.progressTemplateValue
      .replace("%{current}", String(n))
      .replace("%{total}", total)
    this.progressTextTarget.textContent = text
  }
}
