FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ .

EXPOSE 3001 3002

# Default command (not used when we override in docker-compose)
CMD ["node", "oracle.js"]
