FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy backend source code
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
