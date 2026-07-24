FROM node:24-bookworm-slim AS base

ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=600000
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
WORKDIR /opt/app

FROM base AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git python3 make g++ pkg-config \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build

ARG PUBLIC_URL
ARG STRAPI_ADMIN_BACKEND_URL
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV PUBLIC_URL=${PUBLIC_URL}
ENV STRAPI_ADMIN_BACKEND_URL=${STRAPI_ADMIN_BACKEND_URL}

COPY . .
RUN npm run build \
  && mkdir -p database

FROM base AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm cache clean --force \
  && apt-get purge -y --auto-remove python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/app/config ./config
COPY --from=build /opt/app/database ./database
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/public ./public
COPY --from=build /opt/app/scripts ./scripts
COPY --from=build /opt/app/src ./src
COPY --from=build /opt/app/types ./types
COPY --from=build /opt/app/tsconfig.json ./tsconfig.json

RUN mkdir -p public/uploads \
  && chown -R node:node /opt/app

USER node

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:1337/admin').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
