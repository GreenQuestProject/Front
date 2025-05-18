# Étape 1 : build Angular
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Étape 2 : Nginx pour servir l'app
FROM nginx:alpine
# Copie des fichiers build dans Nginx
COPY --from=build /app/dist/front /usr/share/nginx/html
# Copie de la config Nginx personnalisée
COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
