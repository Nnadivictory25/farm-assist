FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app for production
RUN bun run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/data.db

# Expose port
EXPOSE 3000

# Run the production server
CMD ["bun", "run", "server.ts"]

