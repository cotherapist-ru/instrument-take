# Инструкция по публикации `@cotherapist-ru/instrument-take`

Пакет публикуется в **GitHub Packages** (`npm.pkg.github.com`) из отдельного GitHub-репозитория. Scope **обязан** совпадать с владельцем репозитория: организация `cotherapist-ru` → пакет `@cotherapist-ru/instrument-take`.

| Что | Где |
|-----|-----|
| GitHub-репозиторий | https://github.com/cotherapist-ru/instrument-take |
| Пакет | https://github.com/cotherapist-ru/instrument-take/pkgs/npm/instrument-take |
| CI | `.github/workflows/ci.yml` |
| Publish | `.github/workflows/publish.yml` |

Секрет `NPM_TOKEN` **не нужен**: workflow публикует через `GITHUB_TOKEN` с правом `packages: write`.

---

## 1. Предварительные требования

- Доступ к GitHub-организации **[cotherapist-ru](https://github.com/cotherapist-ru)** (push в репозиторий, Releases, Packages)
- Node.js >= 18 локально (для проверки перед релизом)
- В org включена публикация пакетов из Actions: **Settings → Actions → General → Workflow permissions** — Read and write; для Packages: Actions могут создавать пакеты

---

## 2. Одноразовая настройка GitHub

Репозиторий `cotherapist-ru/instrument-take` уже существует. Проверьте:

1. **Settings → Actions → General → Workflow permissions** → Read and write
2. Первая публикация создаёт пакет `instrument-take` в org. Visibility по умолчанию **private**. Не переключайте пакет на Public: обратно в private GitHub не возвращает. `publishConfig.access` должен быть `restricted`.

Локальный remote:

```bash
cd packages/instrument-take
git remote -v
# origin  git@github.com:cotherapist-ru/instrument-take.git
```

---

## 3. Проверка CI

После push в `main`:

1. Откройте **Actions** → workflow **CI**
2. Должны пройти тесты на Node 18, 20, 22

Локально перед релизом:

```bash
npm ci
npm test
npm pack --dry-run   # убедиться, что в tarball только нужные файлы
```

Ожидаемое содержимое tarball: `src/`, `styles/`, `README.md`, `LICENSE`, `package.json`.

---

## 4. Релиз

Тег GitHub Release должен совпадать с `version` в `package.json` (префикс `v`):

| `package.json` | Git tag |
|----------------|---------|
| `0.1.0` | `v0.1.0` (npmjs, больше не публикуется) |
| `0.2.0` | `v0.2.0` (GitHub Packages, private) |
| `0.2.1` | `v0.2.1` (`publishConfig.access: restricted`) |

### 4.1. Создать GitHub Release

1. https://github.com/cotherapist-ru/instrument-take/releases/new
2. **Choose a tag:** `v0.2.1` → **Create new tag** on publish
3. **Target:** `main`
4. **Release title:** `v0.2.1`
5. **Publish release**

Workflow **Publish** запустится автоматически (`on: release: types: [published]`). `--provenance` не используется: это опция npmjs/sigstore, не GitHub Packages.

### 4.2. Проверить результат

1. **Actions** → **Publish** → зелёный статус
2. https://github.com/cotherapist-ru/instrument-take/pkgs/npm/instrument-take — версия `0.2.1`

---

## 5. Последующие релизы

```bash
git checkout main
git pull

npm version patch   # 0.2.1 → 0.2.2
# или: npm version minor / major

git push origin main --follow-tags
```

Затем создайте GitHub Release для тега `vX.Y.Z`. Именно **Publish release** триггерит workflow.

### Semver

| Тип | Когда |
|-----|-------|
| **patch** | багфиксы, без breaking changes |
| **minor** | новая функциональность, обратная совместимость |
| **major** | breaking changes для потребителей пакета |

Breaking change этой линейки: имя пакета сменилось с `@cotherapist/instrument-take` (npmjs) на `@cotherapist-ru/instrument-take` (GitHub Packages).

---

## 6. Ручная публикация (fallback)

Если Actions недоступен:

```bash
# PAT с write:packages, либо GitHub CLI
export NODE_AUTH_TOKEN=$(gh auth token)

npm ci
npm test
npm publish
```

`.npmrc` в корне пакета уже указывает scope `@cotherapist-ru` на `https://npm.pkg.github.com`. Токен в файл не кладите.

---

## 7. Публикация без Release (workflow_dispatch)

В **Actions** → **Publish** → **Run workflow**.

Используйте только если версия в `package.json` на `main` ещё **не** опубликована. Повторная публикация той же версии завершится ошибкой.

---

## 8. Подключение в других проектах

Пакет приватный: без `_authToken` GitHub Packages отвечает 401.

```ini
# .npmrc
@cotherapist-ru:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```json
{
  "dependencies": {
    "@cotherapist-ru/instrument-take": "^0.2.1",
    "@hotwired/stimulus": "^3.2.2"
  }
}
```

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

Токен:

- локально: PAT (classic) с `read:packages`, либо `gh auth token` при входе в org
- GitHub Actions: `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` + `packages: read`
- GitLab CI / Docker: CI/CD variable `NODE_AUTH_TOKEN` (PAT с `read:packages`), передать как build-arg в Dockerfile

### Из монорепо (до публикации / без сети)

```json
{
  "dependencies": {
    "@cotherapist-ru/instrument-take": "file:../packages/instrument-take"
  }
}
```

Путь `file:` не работает в GitLab CI monolith/public-testing: пакет лежит в другом репозитории. Для образов используйте registry.

---

## 9. Troubleshooting

| Проблема | Решение |
|----------|---------|
| `401` / `403` при `npm publish` | Нет `packages: write`; проверить Workflow permissions и org package settings |
| `403` — версия уже существует | Поднять `version` в `package.json`, новый тег и Release |
| `404` при `npm install` | Нет `_authToken`; GitHub Packages не отдаёт пакеты анонимно |
| Scope `@cotherapist/...` | GitHub Packages требует `@<owner>/...`. Owner репозитория — `cotherapist-ru` |
| CI падает на `npm ci` | Закоммитить актуальный `package-lock.json` |
| Release создан, Publish не стартовал | Release должен быть **Published**, не Draft |
| Docker `yarn install` 401 | Передать `NODE_AUTH_TOKEN` как build-arg; `.npmrc` должен попасть в образ |
| Тесты падают локально | `node -v` >= 18; `npm ci && npm test` |

---

## 10. Чеклист релиза

- [ ] Изменения в `cotherapist-ru/instrument-take` запушены в `main`
- [ ] CI на `main` зелёный
- [ ] `npm test` и `npm pack --dry-run` локально OK
- [ ] GitHub Release `vX.Y.Z` опубликован (версия = `package.json`)
- [ ] Workflow **Publish** успешен
- [ ] Пакет виден в GitHub Packages
- [ ] Потребители: `.npmrc` + `@cotherapist-ru/instrument-take@^X.Y.Z` + `NODE_AUTH_TOKEN`
