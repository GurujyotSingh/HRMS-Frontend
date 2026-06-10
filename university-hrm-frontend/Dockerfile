# ── Base / Development Stage ──────────────────────────────────────────────────
FROM node:18-alpine AS development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose port for development server
EXPOSE 3000

# Run in development mode
CMD ["npm", "start"]


# ── Production Stage ──────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine AS production

# Copy custom configuration if needed, otherwise standard SPA redirect configuration
# To prevent client-side routing issues, we can write a simple nginx conf later
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
