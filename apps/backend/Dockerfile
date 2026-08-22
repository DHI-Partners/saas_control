# syntax=docker/dockerfile:1

# Стадия разработки: в образе только зависимости, исходники приезжают
# бинд-маунтом из compose. Поэтому правка файла на хосте видна внутри сразу,
# а `nest start --watch` пересобирает и перезапускает процесс сам.
#
# Всё ставится от пользователя node (uid 1000): контейнер пишет в бинд-маунт
# (dist, src/generated), и файлы должны остаться под тем же владельцем, что и
# на хосте, иначе после докера их не отредактировать без sudo.
FROM node:24-alpine AS dev
WORKDIR /repo
RUN chown node:node /repo
USER node
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/backend/package.json apps/backend/
COPY --chown=node:node apps/frontend/package.json apps/frontend/
RUN npm ci
# Каталог существует в образе от node:node, чтобы анонимный том compose,
# который прячет им node_modules хоста, унаследовал владельца
RUN mkdir -p apps/backend/node_modules
WORKDIR /repo/apps/backend
ENV NODE_ENV=development
EXPOSE 3000
# Клиент Prisma лежит в src/generated (в git его нет) — генерируем на старте,
# заодно подхватывая правки схемы
CMD ["sh", "-c", "npx prisma generate && npm run start:dev"]

# Контекст сборки — корень монорепо: npm workspaces требует корневой
# package.json и package-lock.json, а также манифесты всех воркспейсов.
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
# npm ci выполняется здесь, а не в отдельном слое: часть пакетов workspace
# кладёт в apps/*/node_modules, и копировать пришлось бы оба каталога
RUN npm ci
COPY apps/backend apps/backend
WORKDIR /repo/apps/backend
# Клиент Prisma генерируется в src/generated и компилируется вместе с кодом
RUN npx prisma generate && npm run build

# Минимальный прод-манифест: только dependencies бэкенда, версии зафиксированы
# по тому, что реально поставил npm ci. Ставить прод-зависимости из корневого
# lock нельзя — @prisma/client объявляет prisma и typescript как optional peer,
# и npm ci тянет весь CLI со Studio и движками (+270 МБ).
RUN <<'NODE' node
const fs = require('fs');
const path = require('path');

const pkg = require('/repo/apps/backend/package.json');
const roots = ['/repo/apps/backend/node_modules', '/repo/node_modules'];

const version = (name) => {
  for (const root of roots) {
    const manifest = path.join(root, name, 'package.json');
    if (fs.existsSync(manifest)) {
      return JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
    }
  }
  throw new Error(`не найден установленный пакет: ${name}`);
};

const dependencies = Object.fromEntries(
  Object.keys(pkg.dependencies ?? {}).map((name) => [name, version(name)]),
);

fs.mkdirSync('/prod', { recursive: true });
fs.writeFileSync(
  '/prod/package.json',
  JSON.stringify(
    { name: 'backend', version: pkg.version, private: true, dependencies },
    null,
    2,
  ),
);
NODE

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/package.json ./package.json
# --omit=peer отсекает optional peer prisma/typescript, не нужные на рантайме
RUN npm install --omit=dev --omit=peer --no-audit --no-fund \
    && npm cache clean --force
COPY --from=build /repo/apps/backend/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
