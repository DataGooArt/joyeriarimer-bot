# 🔧 Solución de Problemas (Troubleshooting)

## Problemas Comunes

#### ❌ **Bot no responde a mensajes**
```bash
# Verificar logs
docker logs -f container-name

# Verificar webhook
curl -X GET "https://tu-dominio.com/webhook?hub.verify_token=tu-token"
```

#### ❌ **Error de conexión a MongoDB**
```bash
# Verificar cadena de conexión
node -e "console.log(process.env.MONGO_URI)"

# Probar conexión
npm install mongodb
node -e "const {MongoClient} = require('mongodb'); MongoClient.connect(process.env.MONGO_URI).then(() => console.log('✅ Connected')).catch(console.error)"
```

#### ❌ **Botones no funcionan**
- Verificar que los IDs de botones coincidan en `whatsapp.js` y `webhookHandler.js`
- Verificar formato JSON de botones interactivos
- Comprobar que el número teléfono esté verificado en WhatsApp Business

#### ❌ **IA no responde correctamente**
```bash
# Verificar API key de Gemini
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=TU_API_KEY"
```

## Logs y Monitoreo

```bash
# Ver logs en tiempo real
docker logs -f joyeria-bot --tail 100

# Logs específicos de errores  
docker logs joyeria-bot 2>&1 | grep ERROR

# Verificar uso de recursos
docker stats joyeria-bot
```

## 📊 API Endpoints

### **Webhook Principal**
```http
POST /webhook
Content-Type: application/json

# Procesa todos los mensajes entrantes de WhatsApp
```

### **Verificación de Webhook**
```http
GET /webhook?hub.verify_token=tu-token&hub.challenge=challenge

# Verificación inicial de WhatsApp
```

### **Health Check**
```http
GET /health

# Respuesta: {"status": "OK", "timestamp": "2025-01-XX"}
```
