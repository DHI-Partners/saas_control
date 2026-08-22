<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Локальный запуск

Все команды ниже выполняются из `apps/backend`
(из корня монорепо — через `npm run backend -- <script>`).
Фронтенд живёт в [../frontend](../frontend) и ходит сюда через proxy `/api`.

1. Скопировать env-файл в корне монорепо и при необходимости поправить креды
   (`.env` здесь нет — он один на весь монорепо):

```bash
cp ../../.env.example ../../.env
```

2. Поднять Postgres в Docker (compose лежит в корне монорепо):

```bash
npm run db:up          # из корня: docker compose up -d
```

Контейнер `saas_control_db` (postgres:17-alpine) слушает `localhost:5433`
(порт 5432 на хосте занят локальным Postgres, поэтому пробрасывается 5433).
Данные лежат в volume `pgdata`.

3. Применить миграции и сгенерировать Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate    # клиент генерируется в src/generated/prisma (в .gitignore)
```

4. Запустить приложение:

```bash
npm run start:dev
```

Проверка подключения к БД: `curl http://localhost:3000/health/db`

## Модель данных

```
Client (аккаунт кабинета)  1 ──< N  Site (сайт Frappe)
      └──< N EmailVerificationToken
```

Сайт принадлежит ровно одному клиенту (`Site.clientId`, `onDelete: Cascade`),
у клиента сайтов может быть сколько угодно. Имя сайта (`name` — как в bench:
`crm.example.com`) и дополнительный домен уникальны глобально: два клиента не
могут завести один и тот же сайт. Схема — [prisma/schema.prisma](prisma/schema.prisma).

## Авторизация

Регистрация по почте: `email` + пароль (bcrypt, 12 раундов). После регистрации
на почту уходит ссылка подтверждения — в базе лежит только sha256 от токена,
активна всегда одна ссылка, срок жизни 24 часа. Кабинет открывается сразу,
неподтверждённая почта только показывает баннер.

Сессия — JWT в куке `sc_session` (`httpOnly`, `SameSite=Lax`, срок из
`SESSION_TTL_SECONDS`). Гард [SessionGuard](src/auth/session.guard.ts) навешен
глобально через `APP_GUARD`, поэтому закрыто всё, кроме роутов с `@Public()`;
клиент подгружается из БД на каждый запрос. Для curl и интеграций тот же токен
принимается заголовком `Authorization: Bearer`.

## Ручки

| Метод | Путь | Что делает |
| --- | --- | --- |
| `POST` | `/auth/register` | регистрация, ставит куку сессии, шлёт письмо |
| `POST` | `/auth/login` | вход, ставит куку сессии |
| `POST` | `/auth/logout` | сбрасывает куку |
| `POST` | `/auth/verify-email` | подтверждение почты по токену из письма |
| `POST` | `/auth/verify-email/resend` | переотправить письмо |
| `GET` | `/me` | профиль + сводка по сайтам |
| `PATCH` | `/me` | имя |
| `PUT` | `/me/password` | смена пароля |
| `GET` | `/sites?status=&q=` | сайты клиента с фильтром и поиском |
| `POST` | `/sites` | добавить сайт и отдать его в bench |
| `GET` `PATCH` `DELETE` | `/sites/:id` | один сайт |
| `GET` | `/sites/:id/provisioning` | прогресс развёртывания на бенче |
| `GET` | `/health/db` | публично: проверка БД |

Все `/sites` фильтруются по клиенту из сессии, поэтому чужой сайт по id отдаётся
как `404`, а не `403`: иначе по коду ответа можно было бы перебирать чужие id.

## Развёртывание сайтов (saas_bridge)

Сайты создаёт не кабинет, а [saas_bridge](https://github.com/DHI-Partners/saas_bridge)
— приложение Frappe на управляющем сайте бенча. `POST /sites` пишет сайт в базу
и вызывает `create_site`: тот проверяет запрос синхронно, а `bench new-site`
ставит в очередь. Отказ на проверке снимает запись из базы, иначе имя осталось бы
занятым зря.

Вместе с сайтом заводится System Manager с почтой клиента, а лимит пользователей
берётся из тарифа (`TRIAL` 2, `BASIC` 5, `PRO` 20, `ENTERPRISE` без лимита) и
пишется в конфиг сайта — [PLAN_MAX_USERS](src/sites/sites.service.ts). Пароли
bench генерирует и возвращает **только** в ответе на `create_site`: нигде их не
храним, а отдаём в ответе `POST /sites`, чтобы кабинет показал их клиенту один раз.

`GET /sites/:id/provisioning` опрашивает `get_site_status` и, когда прогон
закончился, сам переводит сайт в `ACTIVE` или в `FAILED` (текст ошибки — в
`provisionError`). Bench помнит прогон сутки, поэтому статус, дошедший до конца,
фиксируется в базе сразу.

| Переменная | Назначение |
| --- | --- |
| `BRIDGE_URL` | адрес управляющего сайта бенча |
| `BRIDGE_API_KEY` / `BRIDGE_API_SECRET` | ключи System Manager, идут в `Authorization: token key:secret` |

Без всех трёх переменных мост выключен: сайт только пишется в базу кабинета,
bench не вызывается — так работает обычная разработка.

## Почта

Если задан `SMTP_URL`, письма уходят через него (nodemailer). Если нет —
письмо не отправляется, а ссылка пишется в лог бэкенда: поток регистрации
проверяется без почтового сервера.

Все переменные живут в корневом `.env` — см.
[переменные окружения](../../README.md#переменные-окружения).

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | адрес Postgres; в контейнерах перекрывается compose |
| `JWT_SECRET` | подпись сессионного JWT, в production обязателен |
| `SESSION_TTL_SECONDS` | срок жизни сессии, по умолчанию 7 дней |
| `COOKIE_SECURE` | `secure` у куки; по умолчанию включается при `NODE_ENV=production` |
| `APP_URL` | адрес фронтенда, из него собирается ссылка подтверждения |
| `SMTP_URL` / `MAIL_FROM` | отправка писем |

## Полезные команды

| Команда | Что делает |
| --- | --- |
| `npm run prisma:migrate` | создать и применить миграцию |
| `npm run prisma:studio` | Prisma Studio |
| `npm test` / `npm run test:e2e` | unit / e2e тесты |

Управление докером — из корня монорепо: `npm run db:up`, `npm run docker:up`,
`npm run db:migrate:docker`.

## Docker

[Dockerfile](Dockerfile) собирается из корня монорепо. Рантайм-образ ставит
зависимости не из корневого lock, а из сгенерированного минимального манифеста:
`@prisma/client` объявляет `prisma` и `typescript` как optional peer, и `npm ci`
тянет весь CLI со Studio и движками — образ раздувается с ~380 МБ до ~770 МБ.
Миграции в докере гоняются отдельным сервисом `migrate` (build-стадия образа,
где Prisma CLI есть).
