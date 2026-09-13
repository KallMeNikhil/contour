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
EXPOSE 5173




CMD ["sh", "-c", "npm run build --workspace=packages/shared && npm run dev --workspace=apps/frontend -- --host 0.0.0.0"]


FROM base AS build




ARG VITE_API_BASE_URL=http://localhost:4000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=apps/frontend


FROM nginx:1.27-alpine AS prod
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
