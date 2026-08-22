# SaaS Control

Монорепозиторий на npm workspaces.

```
.
├── apps/
│   ├── backend/     # NestJS 11 + Prisma 7 + Postgres   :3000
│   └── frontend/    # Next.js 16 (App Router)           :3001
├── docker-compose.yml
└── package.json     # корень workspace
```

Фронт ходит в бэкенд по относительному `/api/*` — его проксирует route handler
[apps/frontend/src/app/api/[...path]/route.ts](apps/frontend/src/app/api/%5B...path%5D/route.ts),
читающий `BACKEND_URL` на каждый запрос. Поэтому нет CORS, адрес бэкенда не
попадает в бандл, и один и тот же образ работает в любом окружении.

## Что внутри

Личный кабинет клиента: регистрация по почте, вход по сессионной куке и база
сайтов Frappe. У клиента может быть сколько угодно сайтов, каждый сайт
принадлежит ровно одному клиенту.

```
Client (аккаунт кабинета)  1 ──< N  Site (сайт Frappe: имя в bench, домен,
                                          статус, тариф, версия, приложения)
```

Подробности: [модель и ручки](apps/backend/README.md#модель-данных) ·
[страницы кабинета](apps/frontend/README.md#личный-кабинет).

## Переменные окружения

`.env` в монорепо **один — корневой**, пер-приложенческих нет. Его читают:

| Кто | Как |
| --- | --- |
| docker compose | сам, для подстановки `${VAR}` в [docker-compose.yml](docker-compose.yml) |
| бэкенд при запуске с хоста | `ConfigModule.forRoot({ envFilePath: '../../.env' })` — [app.module.ts](apps/backend/src/app.module.ts) |
| Prisma CLI | `dotenv` с тем же путём — [prisma.config.ts](apps/backend/prisma.config.ts) |
| фронтенд | ничего не читает: `BACKEND_URL` и база API имеют значения по умолчанию в коде |

Внутри контейнеров файла нет — там всё приходит из `environment:` службы, и
переменная окружения всегда сильнее файла: `@nestjs/config` не перезаписывает
уже заданные ключи. Поэтому одни и те же `JWT_SECRET`, `BRIDGE_*` и прочее
задаются ровно в одном месте, а compose подменяет только адреса, которые внутри
сети выглядят иначе (`DATABASE_URL`, `BACKEND_URL`).

Добавляешь новую переменную — впиши её в [.env.example](.env.example) и, если она
нужна в докере, в `environment:` соответствующей службы compose.

## Режим 1: разработка (в докере только БД)

```bash
npm install
cp .env.example .env                                    # единственный .env на монорепо
npm run db:up                                           # Postgres на localhost:5433
npm run backend -- prisma:migrate
npm run dev                                             # бэк :3000 + фронт :3001
```

Открыть http://localhost:3001 — регистрация, вход и кабинет со списком сайтов;
там же карточка статуса: серверная проверка (Next → Nest) и кнопка проверки из
браузера (через `/api`).

Письма без `SMTP_URL` никуда не уходят — ссылку подтверждения почты видно в
логе бэкенда.

Сайты без `BRIDGE_URL`/`BRIDGE_API_KEY`/`BRIDGE_API_SECRET` только пишутся в базу
кабинета: `bench new-site` не вызывается. Задать их — и создание сайта уходит в
[saas_bridge](https://github.com/DHI-Partners/saas_bridge) на управляющем сайте
бенча (`create_site`), а карточка сайта опрашивает `get_site_status`, пока прогон
не закончится.

## Режим 2: разработка целиком в докере

То же самое, что режим 1, но бэк и фронт тоже в контейнерах — на хосте нужен
только докер. Исходники не копируются в образ, а приезжают бинд-маунтом, внутри
работают те же `nest start --watch` и `next dev`: правка файла на хосте
перезапускает процесс в контейнере, руками пересобирать образ не нужно.

```bash
cp .env.example .env         # единственный .env на монорепо
npm run docker:dev:up        # postgres + backend-dev + frontend-dev, со сборкой
npm run docker:dev:migrate   # prisma migrate deploy внутри сети compose
npm run docker:dev:logs
npm run docker:dev:down
```

Адреса те же: фронт на http://localhost:3001, бэк на :3000. Клиент Prisma
генерируется при старте контейнера, поэтому `src/generated` на хосте иметь
не обязательно.

Что спрятано анонимными томами и почему:

| Путь | Зачем |
| --- | --- |
| `node_modules` (оба приложения) | внутри нужны те, что поставил `npm ci` в образе, а не хостовые |
| `apps/frontend/.next` | в кэше турбопака абсолютные пути, а внутри проект живёт по `/repo` |

Из-за этого после правки зависимостей одного `--build` мало — тома переживают
пересборку. Нужен `docker compose --profile dev up -d --build -V`
(`-V` пересоздаёт анонимные тома).

Точку монтирования внутри бинд-маунта докер создаёт от root, если её нет на
хосте. Каталога `apps/backend/node_modules` в репозитории нет, поэтому на чистом
клоне он появится пустым и под root — не мешает, но чтобы не мешался
`npm install` с хоста, проще создать его заранее:
`mkdir -p apps/backend/node_modules`.

`DATABASE_URL` и `BACKEND_URL` заданы в compose: в корневом `.env` лежат адреса
для запуска с хоста (`localhost:5433`, `localhost:3000`), а внутри сети compose
нужны имена сервисов. Переменная окружения контейнера в любом случае побеждает
`.env`-файл — и у `@nestjs/config`, и у Next.

## Режим 3: прод-сборка в докере

```bash
npm run docker:up            # postgres + backend + frontend, со сборкой образов
npm run db:migrate:docker    # prisma migrate deploy внутри сети compose
npm run docker:logs
npm run docker:down
```

Прод-сборка живёт в профиле `app`, watch-режим — в профиле `dev`, поэтому
`npm run db:up` (без профиля) поднимает только Postgres — это и есть режим 1.
Профиль `tools` — разовые задачи вроде миграций.

| Сервис | Образ | Порт хоста |
| --- | --- | --- |
| `postgres` | `postgres:17-alpine` | `${POSTGRES_PORT:-5433}` → 5432 |
| `backend` | сборка [apps/backend/Dockerfile](apps/backend/Dockerfile) | `${BACKEND_PORT:-3000}` |
| `frontend` | сборка [apps/frontend/Dockerfile](apps/frontend/Dockerfile) | `${FRONTEND_PORT:-3001}` |
| `backend-dev` | dev-стадия [apps/backend/Dockerfile](apps/backend/Dockerfile) | `${BACKEND_PORT:-3000}` |
| `frontend-dev` | dev-стадия [apps/frontend/Dockerfile](apps/frontend/Dockerfile) | `${FRONTEND_PORT:-3001}` |
| `migrate` | build-стадия бэкенда | — |

Порт 5432 на хосте занят локальным Postgres, поэтому контейнер проброшен на
5433. Имя проекта compose закреплено (`name: saas_control`) — иначе при переносе
папки потерялся бы volume с данными.

## Команды из корня

| Команда | Что делает |
| --- | --- |
| `npm run dev` | бэкенд и фронтенд параллельно |
| `npm run build` / `npm test` / `npm run lint` | по обоим приложениям |
| `npm run backend:dev` / `npm run frontend:dev` | по одному приложению |
| `npm run backend -- <script>` | скрипт бэкенда, напр. `npm run backend -- prisma:studio` |
| `npm run frontend -- <script>` | скрипт фронтенда, напр. `npm run frontend -- typecheck` |
| `npm run db:up` / `db:down` / `db:logs` | только Postgres |
| `npm run docker:dev:up` / `docker:dev:down` / `docker:dev:logs` | весь стек в контейнерах, watch-режим |
| `npm run docker:dev:migrate` | `prisma migrate deploy` в работающем `backend-dev` |
| `npm run docker:up` / `docker:down` / `docker:logs` / `docker:build` | весь стек в контейнерах, прод-сборка |
| `npm run db:migrate:docker` | `prisma migrate deploy` в контейнере |

Подробности: [apps/backend/README.md](apps/backend/README.md) ·
[apps/frontend/README.md](apps/frontend/README.md)

## Добавление нового приложения

Кладётся в `apps/<name>` со своим `package.json` (имя вида `@saas-control/<name>`)
и автоматически подхватывается workspace'ом.
