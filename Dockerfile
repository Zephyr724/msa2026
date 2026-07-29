FROM node:24.13-alpine AS frontend-build
WORKDIR /src/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
ARG GOOGLE_MAPS_BROWSER_VALUE=""
ARG GOOGLE_MAPS_MAP_ID=""
RUN VITE_GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_BROWSER_VALUE}" \
    VITE_GOOGLE_MAPS_MAP_ID="${GOOGLE_MAPS_MAP_ID}" \
    npm run build && \
    test -f dist/index.html

FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS backend-build
WORKDIR /src/backend

COPY backend/dotnet-tools.json ./
COPY backend/src/Kiwimpact.Core/Kiwimpact.Core.csproj src/Kiwimpact.Core/
COPY backend/src/Kiwimpact.Infrastructure/Kiwimpact.Infrastructure.csproj src/Kiwimpact.Infrastructure/
COPY backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj src/Kiwimpact.Api/
RUN dotnet restore src/Kiwimpact.Api/Kiwimpact.Api.csproj

COPY backend/src/ src/
RUN dotnet publish src/Kiwimpact.Api/Kiwimpact.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /out/app \
    /p:UseAppHost=false && \
    test ! -e /out/app/appsettings.Development.json
RUN dotnet tool restore && \
    dotnet ef migrations bundle \
      --project src/Kiwimpact.Infrastructure/Kiwimpact.Infrastructure.csproj \
      --startup-project src/Kiwimpact.Api/Kiwimpact.Api.csproj \
      --configuration Release \
      --output /out/migrate

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

USER root
RUN mkdir -p /var/lib/kiwimpact/keys && \
    chown -R app:app /var/lib/kiwimpact
COPY --from=backend-build --chown=app:app /out/app ./
COPY --from=backend-build --chown=app:app /out/migrate ./migrate
COPY --from=frontend-build --chown=app:app /src/frontend/dist ./wwwroot
RUN test -f /app/wwwroot/index.html && test -x /app/migrate

USER app
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_BUNDLE_EXTRACT_BASE_DIR=/tmp/dotnet-bundle
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=4 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "Kiwimpact.Api.dll"]
