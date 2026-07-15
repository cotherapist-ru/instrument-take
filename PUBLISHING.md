# Инструкция по публикации `@cotherapist/instrument-take`

Пакет публикуется в **npm** (`registry.npmjs.org`) из отдельного GitHub-репозитория. CI и публикация автоматизированы через GitHub Actions.

| Что | Где |
|-----|-----|
| GitHub-репозиторий | https://github.com/cotherapist-ru/instrument-take |
| npm-пакет | https://www.npmjs.com/package/@cotherapist/instrument-take |
| CI | `.github/workflows/ci.yml` |
| Publish | `.github/workflows/publish.yml` |

---

## 1. Предварительные требования

- Аккаунт на [npmjs.com](https://www.npmjs.com/)
- Доступ к GitHub-организации **[cotherapist-ru](https://github.com/cotherapist-ru)** (создание репозитория, Secrets, Releases)
- Node.js >= 18 локально (для проверки перед релизом)
- Права на публикацию в npm scope `@cotherapist`

---

## 2. Одноразовая настройка npm

### 2.1. Организация `@cotherapist`

Если scope ещё не создан:

1. Войдите на https://www.npmjs.com/
2. **Account** → **Organizations** → **Create an Organization**
3. Имя: `cotherapist`
4. Тип: **Unlimited public packages** (пакет публичный)

Пригласите в org всех, кто будет публикать релизы.

### 2.2. Automation token для CI

1. npm → **Access Tokens** → **Generate New Token**
2. Тип: **Granular Access Token** (рекомендуется) или **Classic Automation Token**
3. Права:
   - **Read and write** для пакета `@cotherapist/instrument-take`
   - или **Read and write** для всей org `@cotherapist`
4. Скопируйте токен — он показывается один раз

> Для provenance (связь npm ↔ GitHub) токен должен быть **Automation**, не Publish для локальной машины.

---

## 3. Одноразовая настройка GitHub

### 3.1. Создать репозиторий

1. https://github.com/organizations/cotherapist-ru/repositories/new
2. **Repository name:** `instrument-take`
3. **Visibility:** Public (для npm provenance)
4. Без README / .gitignore / license — они уже в пакете

### 3.2. Запушить код

Из каталога пакета в монорепо:

```bash
cd packages/instrument-take

git init
git add .
git commit -m "feat: initial release of @cotherapist/instrument-take"
git branch -M main
git remote add origin git@github.com:cotherapist-ru/instrument-take.git
git push -u origin main
```

SSH или HTTPS — по вашему выбору:

```bash
git remote add origin https://github.com/cotherapist-ru/instrument-take.git
```

### 3.3. Секрет `NPM_TOKEN`

1. GitHub → **cotherapist-ru/instrument-take** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: токен из п. 2.2

### 3.4. (Рекомендуется) Trusted Publishing / Provenance

Workflow уже использует `npm publish --provenance`. Для отображения «Published with provenance» на npm:

1. npm → org **cotherapist** → **Packages** → `@cotherapist/instrument-take` (после первой публикации)
2. **Publishing access** → привязать GitHub repo `cotherapist-ru/instrument-take`

Либо настроить **Trusted Publisher** в npm до первого релиза (npm → Access Tokens → Trusted Publishers → GitHub Actions).

---

## 4. Проверка CI

После push в `main`:

1. Откройте **Actions** → workflow **CI**
2. Должны пройти тесты на Node 18, 20, 22

Локально перед релизом:

```bash
npm ci
npm test
npm pack --dry-run   # убедиться, что в tarball только нужные файлы
```

Ожидаемое содержимое tarball: `src/`, `README.md`, `LICENSE`, `package.json`.

---

## 5. Первый релиз (v0.1.0)

### 5.1. Версия

Текущая версия в `package.json`: **0.1.0**. Тег релиза должен совпадать с префиксом `v`:

| `package.json` | Git tag |
|----------------|---------|
| `0.1.0` | `v0.1.0` |
| `0.2.0` | `v0.2.0` |

### 5.2. Создать GitHub Release

1. https://github.com/cotherapist-ru/instrument-take/releases/new
2. **Choose a tag:** `v0.1.0` → **Create new tag** on publish
3. **Target:** `main`
4. **Release title:** `v0.1.0` (или краткое описание изменений)
5. **Publish release**

Workflow **Publish** запустится автоматически (`on: release: types: [published]`).

### 5.3. Проверить результат

1. **Actions** → **Publish** → зелёный статус
2. https://www.npmjs.com/package/@cotherapist/instrument-take — версия `0.1.0`
3. Установка:

```bash
npm install @cotherapist/instrument-take @hotwired/stimulus
```

---

## 6. Последующие релизы

Стандартный цикл:

```bash
# 1. Изменения в main (через PR)
git checkout main
git pull

# 2. Обновить версию (semver)
npm version patch   # 0.1.0 → 0.1.1
# или: npm version minor / major

# 3. Запушить коммит и тег
git push origin main --follow-tags

# 4. Создать GitHub Release для нового тега vX.Y.Z
```

**Важно:** `npm version` создаёт git-тег `vX.Y.Z` и коммит с новой версией в `package.json`. GitHub Release нужно создать для этого тега — именно **publish release** триггерит workflow.

### Semver

| Тип | Когда |
|-----|-------|
| **patch** | багфиксы, без breaking changes |
| **minor** | новая функциональность, обратная совместимость |
| **major** | breaking changes для потребителей пакета |

---

## 7. Ручная публикация (fallback)

Если Actions недоступен, можно опубликовать локально:

```bash
npm login                    # один раз, аккаунт с доступом к @cotherapist
npm ci
npm test
npm publish --access public  # без --provenance с локальной машины
```

Для CI предпочтительнее только автоматическая публикация через Release.

---

## 8. Публикация без Release (workflow_dispatch)

В **Actions** → **Publish** → **Run workflow** → **Run workflow**.

Используйте только если версия в `package.json` на `main` ещё **не** опубликована в npm. Повторная публикация той же версии завершится ошибкой `403 Forbidden` / `You cannot publish over the previously published versions`.

---

## 9. Подключение в других проектах

### Из npm (после публикации)

```json
{
  "dependencies": {
    "@cotherapist/instrument-take": "^0.1.0",
    "@hotwired/stimulus": "^3.2.2"
  }
}
```

### Из монорепо (до публикации / для разработки)

```json
{
  "dependencies": {
    "@cotherapist/instrument-take": "file:../packages/instrument-take"
  }
}
```

После выхода стабильной версии в `cotherapist-public-testing` можно перейти на semver из npm:

```bash
cd cotherapist-public-testing
npm install @cotherapist/instrument-take@^0.1.0
```

---

## 10. Troubleshooting

| Проблема | Решение |
|----------|---------|
| `402 Payment Required` / scope не найден | Создать org `@cotherapist` на npm или проверить членство |
| `403 Forbidden` при publish | Токен без write-доступа; обновить `NPM_TOKEN` |
| `403` — версия уже существует | Поднять `version` в `package.json`, новый тег и Release |
| CI падает на `npm ci` | Закоммитить актуальный `package-lock.json` |
| Provenance не отображается | Public repo + `id-token: write` + Automation token + Trusted Publisher |
| Release создан, Publish не стартовал | Release должен быть **Published**, не Draft; проверить вкладку Actions |
| Тесты падают локально | `node -v` >= 18; `npm ci && npm test` |

---

## 11. Чеклист первой публикации

- [ ] Org `@cotherapist` на npm создана
- [ ] Automation token создан
- [ ] Репозиторий `cotherapist-ru/instrument-take` на GitHub создан
- [ ] Код запушен в `main`
- [ ] Секрет `NPM_TOKEN` добавлен в GitHub Actions
- [ ] CI на `main` зелёный
- [ ] `npm test` и `npm pack --dry-run` локально OK
- [ ] GitHub Release `v0.1.0` опубликован
- [ ] Workflow **Publish** успешен
- [ ] Пакет виден на npm и устанавливается
