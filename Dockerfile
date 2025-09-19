# Etapa 1: Construcción
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar los archivos de definición de paquetes
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Etapa 2: Producción
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar dependencias desde la etapa de construcción
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Copiar el código de la aplicación
COPY . .

# Exponer el puerto en el que se ejecuta la aplicación
EXPOSE 1337

# Comando para iniciar la aplicación
CMD [ "node", "index.js" ]