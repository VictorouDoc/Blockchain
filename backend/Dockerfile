# ===========================
# Backend Dockerfile
# ===========================
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for better caching)
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY backend/ .

# Expose ports for Oracle (3001) and Indexer (3002)
EXPOSE 3001 3002

# Default command
CMD ["npm", "run", "dev"]
