# @cotherapist-ru/instrument-take

[![CI](https://github.com/cotherapist-ru/instrument-take/actions/workflows/ci.yml/badge.svg)](https://github.com/cotherapist-ru/instrument-take/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/cotherapist-ru/instrument-take)](https://github.com/cotherapist-ru/instrument-take/pkgs/npm/instrument-take)

Stimulus-контроллеры для прохождения психологических тестов (form archetypes):

- `questionnaire-wizard` — пошаговый опросник с авто-submit
- `ordered-selection` — ранжирование / выбор в колонках (портретные методики)
- `stimulus-wizard` — wizard для стимульных методик
- `submit-loading` — блокировка формы при отправке без отмены навигации в Chromium

Пакет публикуется в **GitHub Packages** (`npm.pkg.github.com`). Scope совпадает с GitHub-организацией: `@cotherapist-ru`.

## Установка

Пакет **приватный**: GitHub Packages не отдаёт его без токена. В корне потребителя:

```ini
# .npmrc
@cotherapist-ru:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
export NODE_AUTH_TOKEN=ghp_...   # PAT с read:packages, либо GITHUB_TOKEN в CI
npm install @cotherapist-ru/instrument-take @hotwired/stimulus
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
} from "@cotherapist-ru/instrument-take"

const app = Application.start()
app.register("questionnaire-wizard", QuestionnaireWizardController)
app.register("ordered-selection", OrderedSelectionController)
app.register("stimulus-wizard", StimulusWizardController)
app.register("submit-loading", SubmitLoadingController)
```

Хелперы экспортируются из корня пакета:

```js
import { findStepElement, parseDataset, lockSubmitButtons } from "@cotherapist-ru/instrument-take"
```

Стили портретного `ordered-selection` (Сонди) — в пакете:

```css
@import "@cotherapist-ru/instrument-take/styles/ordered-selection.css";
```

Для Sass (monolith) импортируйте без расширения `.css`, чтобы стили встроились в бандл:

```scss
@import "@cotherapist-ru/instrument-take/styles/ordered-selection";
```

В public-testing файл копируется при `task assets` в `web/static/instrument-take-ordered-selection.css`.

## Разработка

```bash
npm ci
npm test
```

Требуется Node.js >= 18 (встроенный `node:test`).

## Публикация

Подробная инструкция: **[PUBLISHING.md](PUBLISHING.md)**.

Кратко:

1. Репозиторий: [github.com/cotherapist-ru/instrument-take](https://github.com/cotherapist-ru/instrument-take)
2. GitHub Release с тегом `vX.Y.Z` = `version` в `package.json`
3. Workflow **Publish** публикует в GitHub Packages через `GITHUB_TOKEN` (секрет `NPM_TOKEN` не нужен)

## Лицензия

MIT — см. [LICENSE](LICENSE).
