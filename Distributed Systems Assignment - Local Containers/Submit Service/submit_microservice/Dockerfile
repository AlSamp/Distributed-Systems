# Stage 1: Build each service individually
FROM node:14 AS builder

# Set working directory for each service
WORKDIR /app/submit
COPY submit/package*.json ./
RUN npm install
COPY submit/ .

# Stage 2: Create final image and copy built services
FROM node:14

# Set working directory for final image
WORKDIR /app

# Copy built services from builder stage
COPY --from=builder /app/submit /app/submit

# Command to start the services
CMD ["npm", "start"]
