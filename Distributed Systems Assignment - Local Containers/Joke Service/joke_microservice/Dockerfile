# Stage 1: Build each service individually
FROM node:14 AS builder

# Set working directory for each service
WORKDIR /app/joke
COPY joke/package*.json ./
RUN npm install
COPY joke/ .

WORKDIR /app/etl
COPY etl/package*.json ./
RUN npm install
COPY etl/ .

# Stage 2: Create final image and copy built services
FROM node:14

# Set working directory for final image
WORKDIR /app

# Copy built services from builder stage
COPY --from=builder /app/joke /app/joke
COPY --from=builder /app/etl /app/etl

# Expose ports if necessary
# EXPOSE 3000
# EXPOSE 3001

# Command to start the services
CMD ["npm", "start"]
