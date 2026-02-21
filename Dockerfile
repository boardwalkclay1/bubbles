FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy all application files
COPY . .

EXPOSE 8080

CMD ["node", "backend/server.js"]
