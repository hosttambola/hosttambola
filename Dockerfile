# Use an official Node.js runtime as a parent image
FROM node:16-slim

# Install necessary dependencies for Puppeteer (headless Chrome)
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Set the PUPPETEER_EXECUTABLE_PATH environment variable to ensure Puppeteer works
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose the port your app will run on
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]
