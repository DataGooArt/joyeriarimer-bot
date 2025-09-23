# 🧪 Tests y Validación - Joyería Bot

## 📋 Tests Disponibles

### 🤖 Tests de IA y Conversación
```bash
npm run chat              # Chat local interactivo (sin WhatsApp)
```

### 📅 Tests de Sistema de Citas
```bash
npm test                  # Test completo end-to-end
npm run test:appointment  # Test específico de citas
```

### 🔐 Tests de Seguridad
```bash
npm run test:encryption   # Verificar cifrado RSA
npm run validate          # Validar configuración completa
```

### 🐳 Tests con Docker
```bash
npm run docker:test       # Tests en contenedor aislado
```

## 🎯 Test Completo End-to-End

El test `npm test` valida todo el flujo:

1. **Configuración del servidor** ✅
2. **Conexión a MongoDB** ✅  
3. **Verificación de claves RSA** ✅
4. **Respuesta a ping de Meta** ✅
5. **Detección de intenciones de IA** ✅
6. **Activación de Flow de citas** ✅
7. **Procesamiento de appointment** ✅
8. **Notificaciones automáticas** ✅

## 📊 Resultado Esperado

```
✅ Configuración del servidor: OK
✅ Base de datos MongoDB: Conectada
✅ Claves RSA: Válidas
✅ Endpoint /webhook: Respondiendo
✅ Ping de validación: Meta acepta
✅ IA Gemini: Detectando intenciones
✅ Flow de citas: Activo (ID: 24509326838732458)
✅ Notificaciones: Sistema funcional

🎉 SISTEMA COMPLETO OPERACIONAL
```

## 🔧 Troubleshooting

### Error: "MongoDB connection failed"
```bash
# Verificar conexión
node -e "console.log(process.env.MONGO_URI)"
```

### Error: "RSA keys not found"
```bash
# Generar claves
node generate-keys.js
```

### Error: "Flow not responding"
```bash
# Verificar Flow en Meta Business Manager
# ID debe ser: 24509326838732458
```

## 🚀 Test de Producción

```bash
# Test rápido en producción
curl -X GET https://tu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=tu_token&hub.challenge=test

# Debería responder: test
```

## 📱 Test Manual con WhatsApp

1. Envía mensaje: **"Hola"**
2. Bot responde con bienvenida
3. Envía: **"Quiero agendar una cita"**  
4. Bot activa Flow automáticamente
5. Completa el Flow interactivo
6. Verifica notificación de confirmación

## 🔍 Logs y Monitoreo

```bash
# Ver logs en tiempo real
docker logs -f whatsapp-joyeria-app-1

# Buscar errores específicos
docker logs whatsapp-joyeria-app-1 2>&1 | grep ERROR
```