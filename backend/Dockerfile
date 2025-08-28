# Base image
FROM node:20-slim



# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./ 
RUN npm install

# Copy application source
COPY . .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
