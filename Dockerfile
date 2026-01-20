# Use Node.js 20 slim as the base image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the application logic
COPY app.js ./

# Expose the application port
EXPOSE 9901

# Command to run the application
CMD ["node", "app.js"]
