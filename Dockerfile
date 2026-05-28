# Mock API container image
FROM node:20-alpine AS builder
ARG OPENAPI_SPEC_FILE
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY *.yaml ./
COPY scripts ./scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
ARG OPENAPI_SPEC_FILE
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/*.yaml ./
RUN npm install --omit=dev
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
