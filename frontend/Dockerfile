# CareCircle Frontend Multi-Stage Dockerfile — Cloud Run & Docker Compose ready
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production server stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Google Cloud Run default HTTP port
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
