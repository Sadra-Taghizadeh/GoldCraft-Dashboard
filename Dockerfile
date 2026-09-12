# Build stage - creates static files for nginx to serve
FROM node:20 AS build-stage

WORKDIR /app

# Accept build-time arguments and set as environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Install dependencies
COPY package*.json ./

# RUN npm ci --legacy-peer-deps
RUN npm install 
# --registry="https://mirror-npm.runflare.com"

# Copy source files
COPY . .

# Build the app (includes type-check and Vite build)
RUN npm run build:icons
RUN npm run build

# Production stage - uses alpine for file extraction compatibility
# The infra nginx will mount these files via volume
# FROM alpine:latest AS production-stage
FROM docker.arvancloud.ir/alpine:latest AS production-stage

# Copy built static files - these will be extracted and served by infra nginx
COPY --from=build-stage /app/dist /dist

# Default command that makes the container exit successfully
# (Useful for docker-compose up without keeping container running)
CMD ["sh", "-c", "echo 'Dashboard static files ready in /dist' && exit 0"]
