FROM node:26-bookworm-slim AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser/ /usr/share/nginx/html/
EXPOSE 8080
