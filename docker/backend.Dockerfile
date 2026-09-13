# syntax=docker/dockerfile:1















FROM node:20-alpine AS base
WORKDIR /app



COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci


FROM base AS dev
COPY . .



RUN npm run build --workspace=packages/shared
EXPOSE 4000



CMD ["sh", "-c", "npm run build --workspace=packages/shared && npm run dev --workspace=apps/backend"]


FROM base AS build
COPY . .
RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=apps/backend


FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json


RUN npm ci --omit=dev --workspace=apps/backend --workspace=packages/shared

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

EXPOSE 4000
CMD ["node", "apps/backend/dist/index.js"]
