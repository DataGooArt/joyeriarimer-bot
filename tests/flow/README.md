# Tests de WhatsApp Flow - Joyería Bot

Esta carpeta contiene todos los tests relacionados con el sistema de agendamiento de citas mediante WhatsApp Flows.

## 📁 Estructura de Tests (Todos Organizados)

### Tests de Verificación Rápida
- **`test-quick-verification.js`** - ✅ Test rápido sin envío real de mensajes
  - Verifica que el bot esté configurado correctamente
  - Valida funciones de generación de fechas
  - Confirma estructura de datos del Flow

### Tests de Integración Completa
- **`test-master-integration.js`** - 🚀 Test maestro con envío real de Flows
  - Prueba detección de intención completa
  - Envía Flows reales a WhatsApp
  - Verifica integración end-to-end
- **`test-integration-mock.js`** - Test de integración con datos mock
- **`test-webhook-integration.js`** - Test de integración del webhook

### Tests de Flow Específicos
- **`test-appointment-flow.js`** - Test específico del Flow de citas
- **`test-appointment-flow-v1.js`** - Versión 1 del test de citas (migrado)
- **`test-flow-simple.js`** - Test básico de envío de Flow
- **`test-flow-with-data.js`** - Test de Flow con datos dinámicos
- **`test-flow-progressive.js`** - Test progresivo de funcionalidad
- **`test-flow-simplified.js`** - Test con Flow simplificado

### Tests de Configuración
- **`test-flow-config.js`** - ⚙️ Test de configuración del Flow
- **`diagnostic-mongodb.js`** - Diagnóstico de conexión MongoDB

### Tests de Endpoint
- **`test-endpoint.js`** - Test del endpoint de data_exchange
- **`test-complete-flow-fixed.js`** - Test completo con correcciones

## 🚀 Cómo Ejecutar los Tests

### 1. Test Rápido (Recomendado primero)
```bash
node tests/flow/test-quick-verification.js
```
- ✅ No envía mensajes reales
- ✅ Verifica configuración
- ✅ Seguro de ejecutar en cualquier momento

### 2. Test de Integración Completa
```bash
node tests/flow/test-master-integration.js
```
- ⚠️ ENVÍA FLOWS REALES a WhatsApp
- 🔥 Solo ejecutar cuando quieras probar en producción
- 📱 Enviará a número configurado en el test

### 3. Tests Específicos
```bash
# Test individual de Flow
node tests/flow/test-appointment-flow.js

# Test de endpoint solamente
node tests/flow/test-endpoint.js

# Test simple de envío
node tests/flow/test-flow-simple.js
```

## 📋 Orden Recomendado de Ejecución

1. **Primero**: `test-quick-verification.js` - Para verificar configuración
2. **Segundo**: `test-endpoint.js` - Para probar endpoint aislado
3. **Tercero**: `test-master-integration.js` - Para test completo con envío real

## ⚙️ Configuración Requerida

### Variables de Entorno (.env)
```env
WHATSAPP_TOKEN=tu_token_aquí
PHONE_NUMBER_ID=tu_phone_id_aquí
MONGODB_URI=tu_mongodb_uri_aquí
OPENAI_API_KEY=tu_openai_key_aquí
```

### Archivos de Claves
- `private_key.pem` - Clave privada para cifrado de Flow
- `public_key.pem` - Clave pública para cifrado de Flow

## 🔧 Troubleshooting

### Error: "Función no encontrada"
```bash
# Verificar que el bot esté correctamente configurado
node tests/flow/test-quick-verification.js
```

### Error: "Flow no se envía"
1. Verificar configuración de WhatsApp Business API
2. Confirmar que el Flow está configurado en Meta Business Manager
3. Validar que las claves de cifrado están configuradas

### Error: "Endpoint no responde"
```bash
# Probar endpoint aislado
node tests/flow/test-endpoint.js
```

## 📊 Resultados Esperados

### Test Exitoso ✅
```
🚀 Test Rápido - Detección de Intención de Citas
==================================================
✅ Todas las funciones están disponibles
✅ Fechas generadas: 6 fechas disponibles
✅ Estructura de fechas correcta
🚀 LISTO PARA PRODUCCIÓN
```

### Test con Errores ❌
```
❌ ERROR en el test: Función processTextMessage no encontrada
🔧 Revisar configuración del bot
```

## 🎯 Próximos Pasos

1. ✅ Ejecutar `test-quick-verification.js`
2. ✅ Si pasa, ejecutar `test-master-integration.js`
3. 🚀 Si todo funciona, construir imagen Docker
4. 📦 Desplegar a producción
5. 📱 Probar en WhatsApp real

## 📞 Soporte

Si algún test falla:
1. Revisar configuración de variables de entorno
2. Verificar conexión a MongoDB
3. Confirmar configuración de WhatsApp Business API
4. Validar configuración del Flow en Meta Business Manager