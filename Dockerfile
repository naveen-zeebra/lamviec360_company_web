FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application for production
RUN npm run build

# Expose the port specified in package.json
EXPOSE 3002

# Start the production server
CMD ["npm", "run", "start"]
