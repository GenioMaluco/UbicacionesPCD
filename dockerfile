# Usamos una imagen ligera de Nginx
FROM nginx:alpine

# Copiamos nuestros archivos estáticos al directorio que Nginx utiliza por defecto
COPY . /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80