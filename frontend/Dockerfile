# ===========================
# Frontend Dockerfile
# ===========================
FROM node:18-alpine AS build

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Production server (using Nginx)
FROM nginx:stable-alpine

# Copy built files to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Default command
CMD ["nginx", "-g", "daemon off;"]
