FROM node:18 AS build
WORKDIR /app

# 🔹 1. Recibir variable en build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 🔹 2. Build normal
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 🔹 3. Servir con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]