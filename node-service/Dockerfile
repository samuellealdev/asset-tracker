# Stage 1: Install production dependencies
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: Minimal runtime image
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy only production dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

USER node

CMD ["node", "index.js"]
