FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies needed for build (e.g. for bcrypt) and OpenSSL for Prisma
RUN apk add --no-cache python3 make g++ openssl

RUN npm install --legacy-peer-deps

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./

# CRITICAL: Copy prisma directory BEFORE npm install so that the postinstall script ("prisma generate") can find the schema
COPY --from=builder /app/prisma ./prisma

# Link openssl and install dependencies
RUN apk add --no-cache python3 make g++ openssl && \
    npm install --only=production --legacy-peer-deps && \
    apk del python3 make g++

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main"]
