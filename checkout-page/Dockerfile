# Step 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# 1. Build the main React Checkout application
RUN npm run build

# 2. Build the Embeddable SDK (generates /app/dist/checkout.js)
RUN npm run build:sdk

# Step 2: Serve
FROM nginx:stable-alpine

# Copy the custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build files
COPY --from=build /app/build /usr/share/nginx/html

# NEW: Copy the bundled SDK file to the public directory
# This allows merchants to access it via http://localhost:3003/checkout.js
COPY --from=build /app/dist/checkout.js /usr/share/nginx/html/checkout.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]