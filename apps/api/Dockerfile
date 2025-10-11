FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Build the application
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
