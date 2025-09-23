# 🎯 Modos de Ejecución y Despliegue

## Modos de Ejecución

### 🧪 **Desarrollo Local** 
```bash
npm run dev          # Servidor con hot-reload
```

### 🤖 **Modo Simulación** (Sin WhatsApp)
```bash
npm run chat         # Chat local para probar IA
```

### 🐳 **Docker Local**
```bash
npm run docker:local  # Docker con MongoDB local
```

### 🚀 **Producción**
```bash
npm run docker:prod   # Docker con todas las optimizaciones
```

## Despliegue en Producción

#### Opción A: Despliegue con Docker Compose
```bash
# 1. Configurar docker-compose.yml con tus variables
cp docker-compose.example.yml docker-compose.yml

# 2. Editar variables de entorno
nano docker-compose.yml

# 3. Desplegar
docker-compose up -d
```

#### Opción B: Construcción de Imagen Custom
```bash
# 1. Construir imagen
docker build -t tu-usuario/joyeria-bot:2.0.5 .

# 2. Subir a registry
docker push tu-usuario/joyeria-bot:2.0.5

# 3. Usar en producción
# Actualizar docker-compose.yml con tu imagen
```
