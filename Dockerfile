# Mock API container image
FROM node:26.13.0-alpine3.24 AS builder
ARG OPENAPI_SPEC_FILE
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY *.yaml ./
COPY scripts ./scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:26.13.0-alpine3.24
ARG OPENAPI_SPEC_FILE
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/*.yaml ./
RUN npm ci --omit=dev
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
