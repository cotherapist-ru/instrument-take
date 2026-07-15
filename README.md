# @cotherapist/instrument-take

[![CI](https://github.com/cotherapist-ru/instrument-take/actions/workflows/ci.yml/badge.svg)](https://github.com/cotherapist-ru/instrument-take/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@cotherapist/instrument-take.svg)](https://www.npmjs.com/package/@cotherapist/instrument-take)

Stimulus-контроллеры для прохождения психологических тестов (form archetypes):

- `questionnaire-wizard` — пошаговый опросник с авто-submit
- `ordered-selection` — ранжирование / выбор в колонках (портретные методики)
- `stimulus-wizard` — wizard для стимульных методик
- `submit-loading` — блокировка формы при отправке без отмены навигации в Chromium

## Установка

```bash
npm install @cotherapist/instrument-take @hotwired/stimulus
```

`@hotwired/stimulus` — peer dependency (>= 3.2).

## Использование

```js
import { Application } from "@hotwired/stimulus"
import {
  QuestionnaireWizardController,
  OrderedSelectionController,
  StimulusWizardController,
  SubmitLoadingController,
} from "@cotherapist/instrument-take"

const app = Application.start()
app.register("questionnaire-wizard", QuestionnaireWizardController)
app.register("ordered-selection", OrderedSelectionController)
app.register("stimulus-wizard", StimulusWizardController)
app.register("submit-loading", SubmitLoadingController)
```

Хелперы экспортируются из корня пакета:

```js
import { findStepElement, parseDataset, lockSubmitButtons } from "@cotherapist/instrument-take"
```

Стили портретного `ordered-selection` (Сонди) — в пакете:

```css
@import "@cotherapist/instrument-take/styles/ordered-selection.css";
```

Для Sass (monolith) импортируйте без расширения `.css`, чтобы стили встроились в бандл:

```scss
@import "@cotherapist/instrument-take/styles/ordered-selection";
```

В public-testing файл копируется при `task assets` в `web/static/instrument-take-ordered-selection.css`.

## Разработка

```bash
npm ci
npm test
```

Требуется Node.js >= 18 (встроенный `node:test`).

## Публикация

Подробная пошаговая инструкция: **[PUBLISHING.md](PUBLISHING.md)** (npm org, GitHub Secrets, первый и последующие релизы).

Кратко:

1. Репозиторий: [github.com/cotherapist-ru/instrument-take](https://github.com/cotherapist-ru/instrument-take)
2. Секрет `NPM_TOKEN` в GitHub Actions (Automation token org `@cotherapist`)
3. GitHub Release с тегом `vX.Y.Z` = `version` в `package.json` → workflow **Publish** публикует в npm

## Лицензия

MIT — см. [LICENSE](LICENSE).
