# Etapa 1: Usar una imagen base de Node.js ligera y segura
FROM node:18-alpine AS base

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de definición de dependencias
COPY package*.json ./

# Instalar solo las dependencias de producción para mantener la imagen pequeña
RUN npm install --production

# Copiar el resto de los archivos de la aplicación al directorio de trabajo
COPY . .

# Exponer el puerto en el que la aplicación se ejecuta dentro del contenedor
EXPOSE 1337

# Comando para iniciar la aplicación cuando el contenedor se inicie
CMD [ "node", "index.js" ]