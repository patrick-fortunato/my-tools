# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage: .NET 10 SDK + Node.js
#
# The MyTools.Api.csproj "BuildAngularClient" MSBuild target runs
# `npm install` + `npm run build` (ng build) during `dotnet publish`, so the
# build image needs both the .NET SDK and Node.js on PATH. A single
# `dotnet publish` therefore produces the .NET app AND the Angular client
# (synced into wwwroot) in one step.
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

# Install Node.js 22 LTS (required by the Angular build target).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Restore first (better layer caching). nuget.config pins to nuget.org.
COPY nuget.config ./
COPY MyTools.Api/MyTools.Api.csproj MyTools.Api/
RUN dotnet restore MyTools.Api/MyTools.Api.csproj

# Restore npm packages next so client deps cache independently of C# source.
COPY MyTools.Client/package.json MyTools.Client/package-lock.json* MyTools.Client/
RUN npm --prefix MyTools.Client install

# Copy the rest of the source and publish (also runs ng build -> wwwroot).
COPY . .
RUN dotnet publish MyTools.Api/MyTools.Api.csproj -c Release -o /app/publish

# ---------------------------------------------------------------------------
# Runtime stage: ASP.NET Core runtime only (no SDK, no Node).
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app
COPY --from=build /app/publish ./

# Kestrel listens on 8080 inside the container by default for ASP.NET images.
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "MyTools.Api.dll"]
