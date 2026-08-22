# Стадия разработки: в образе только зависимости, исходники приезжают
# бинд-маунтом из compose. `next dev` следит за файлами сам, поэтому правка
# на хосте сразу перерисовывает страницу.
#
# Всё ставится от пользователя node (uid 1000): совпадает с владельцем файлов
# на хосте, иначе контейнер оставил бы в проекте root-овые артефакты.
FROM node:24-alpine AS dev
WORKDIR /repo
RUN chown node:node /repo
USER node
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/backend/package.json apps/backend/
COPY --chown=node:node apps/frontend/package.json apps/frontend/
RUN npm ci
# Каталоги существуют в образе от node:node, чтобы анонимные тома compose,
# которые прячут ими node_modules и .next хоста, унаследовали владельца.
# .next обязательно свой: в кэше турбопака лежат абсолютные пути, а внутри
# контейнера проект живёт по /repo, а не по пути хоста
RUN mkdir -p apps/frontend/node_modules apps/frontend/.next
WORKDIR /repo/apps/frontend
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
EXPOSE 3001
# -H 0.0.0.0: иначе порт слушался бы только внутри контейнера
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

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
COPY apps/frontend apps/frontend
WORKDIR /repo/apps/frontend
# standalone включается только здесь: с ним ломается локальный `next start`
ENV NEXT_OUTPUT_STANDALONE=1 NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0
# standalone уже содержит нужный срез node_modules
COPY --from=build /repo/apps/frontend/.next/standalone ./
COPY --from=build /repo/apps/frontend/.next/static apps/frontend/.next/static
COPY --from=build /repo/apps/frontend/public apps/frontend/public
USER node
EXPOSE 3001
CMD ["node", "apps/frontend/server.js"]
