FROM node:20-slim

# Install system dependencies including FontForge
RUN apt-get update && apt-get install -y \
    fontforge \
    python3-fontforge \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 