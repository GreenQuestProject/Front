# Étape 1 : build Angular
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

ARG CONFIG=production
RUN npm run build -- --configuration=$CONFIG

# Étape 2 : Nginx pour servir l'app
FROM nginx:alpine
COPY --from=build /app/dist/front/browser /usr/share/nginx/html
COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
