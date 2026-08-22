# @saas-control/frontend

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Vitest.

Все команды выполняются из этой папки, из корня монорепо —
через `npm run frontend -- <script>`.

## Запуск

```bash
npm run dev            # http://localhost:3001
```

Своего `.env` у фронтенда нет: `BACKEND_URL` (`http://localhost:3000`) и база
API (`/api`) имеют такие же значения по умолчанию в коде, а другие адреса
задаются переменными окружения — в докере их ставит compose.

Бэкенд должен быть поднят на :3000 (`npm run db:up && npm run backend:dev`
из корня) — иначе карточка статуса на главной покажет ошибку связи.

## Связь с бэкендом

| Слой | Что использует | Куда ходит |
| --- | --- | --- |
| Браузер | `api` из [src/lib/api.ts](src/lib/api.ts) | относительный `/api/*` → прокси-хендлер [src/app/api/[...path]/route.ts](src/app/api/%5B...path%5D/route.ts) |
| Сервер Next (RSC) | `serverApi` из [src/lib/api.server.ts](src/lib/api.server.ts) | абсолютный `BACKEND_URL`, минуя rewrite |

Серверный клиент ходит с `cache: 'no-store'` — иначе Next вмораживает ответ
в статическую сборку.

Прокси сделан route handler'ом, а не `rewrites` из `next.config.ts`: rewrite
вычисляется на этапе сборки и вшивается в манифест, поэтому в докер-образе
`BACKEND_URL` на него уже не влияет.

## Личный кабинет

| Маршрут | Что показывает |
| --- | --- |
| `/` | вход/регистрация или ссылка в кабинет + статус бэкенда |
| `/register`, `/login` | регистрация по почте и вход |
| `/verify-email?token=…` | подтверждение почты по ссылке из письма |
| `/dashboard` | сайты клиента: список и фильтр |
| `/dashboard/sites/new` | создание сайта, показ разовых паролей |
| `/dashboard/sites/[id]` | правка, удаление, прогресс развёртывания |
| `/dashboard/welcome` | приветствие и первые шаги |
| `/dashboard/billing` | сайты по тарифам |
| `/dashboard/profile` | имя, смена пароля |
| `/dashboard/status` | проверка связи с API |

Разделы кабинета собраны в левом меню
([src/components/dashboard/sidebar.tsx](src/components/dashboard/sidebar.tsx)):
активный пункт считается по `usePathname`, поэтому меню клиентское, а сам layout
остаётся серверным.

Имя сайта вводится одним поддоменом — суффикс `.habibi-erp.com` приклеивается в
[site-fields.tsx](src/components/dashboard/site-fields.tsx) и обрезается обратно
в форме правки. Пока сайт разворачивается, его карточка опрашивает бэкенд и
перерисовывается сама
([auto-refresh.tsx](src/components/dashboard/auto-refresh.tsx)).

Страницы серверные: данные тянет `sessionApi()` из
[src/lib/api.server.ts](src/lib/api.server.ts) — тот же клиент, но с куками
текущего запроса, иначе бэкенд ответил бы `401`. Проверка сессии —
[src/lib/session.ts](src/lib/session.ts): `requireProfile()` уводит гостя на
`/login`, `currentProfile()` возвращает `null`.

Формы — клиентские, на общем [SubmitForm](src/components/submit-form.tsx):
он шлёт запрос через `api`, показывает ошибки бэкенда (в том числе список
ошибок валидации) и блокирует кнопку. Куку сессии ставит и снимает сам
бэкенд, поэтому после успеха достаточно `router.refresh()`.

Подтверждение почты сделано кнопкой, а не автоматически при открытии
страницы: почтовые сканеры ходят по ссылкам из писем сами и сожгли бы токен
до того, как его откроет человек.

## Docker

Образ собирается из корня монорепо ([Dockerfile](Dockerfile)) в режиме
Next standalone. `output: 'standalone'` включается только переменной
`NEXT_OUTPUT_STANDALONE` — с ним не работает локальный `next start`.

## Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `BACKEND_URL` | адрес NestJS для rewrite и серверных запросов (по умолчанию `http://localhost:3000`) |
| `NEXT_PUBLIC_API_BASE_URL` | база для запросов из браузера, по умолчанию `/api` |

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` / `build` / `start` | Next на порту 3001 |
| `npm run lint` | ESLint (`eslint-config-next` + `eslint-config-prettier`) |
| `npm run format` | Prettier |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm test` / `npm run test:watch` | Vitest + Testing Library (jsdom) |

`next typegen` в `typecheck` обязателен: типы вроде `LayoutProps<"/">`
генерируются Next и без него `tsc` их не найдёт.

## Что не поставлено намеренно

shadcn/ui и TanStack Query не ставились. Когда понадобятся:

```bash
npx shadcn@latest init
npm i @tanstack/react-query
```
