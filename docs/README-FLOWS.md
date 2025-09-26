# 🚀 WhatsApp Flows - Configuración de Endpoint Cifrado

## 📋 Resumen Rápido

Este proyecto implementa un endpoint completamente funcional para **WhatsApp Flows** con cifrado end-to-end usando **RSA-2048** + **AES-128-GCM**, validado exitosamente por Meta.

## 🎯 Estado Actual
- ✅ **Endpoint validado por Meta**
- ✅ **Cifrado RSA-OAEP + AES-GCM funcionando**
- ✅ **Claves RSA 2048-bit generadas y configuradas**
- ✅ **Respuesta correcta a ping de validación**
- ✅ **Infraestructura en producción**

## 🔧 Verificación Rápida

```bash
# Verificar configuración completa
node verificar-configuracion.js

# Verificar estado de claves en Meta
node upload-flow-key.js

# Probar cifrado local
node test-encryption.js
```

## 📚 Documentación Completa

Para implementar desde cero o entender el proceso completo:

👉 **[GUÍA COMPLETA DE CONFIGURACIÓN](./GUIA-CONFIGURACION-FLOWS.md)**

Esta guía incluye:
- Generación de claves RSA
- Implementación del código de cifrado
- Configuración del endpoint
- Subida de claves a Meta
- Despliegue en producción
- Solución de problemas
- Verificación final

## 🚀 Inicio Rápido

### 1. Generar Claves
```bash
node generate-keys.js
```

### 2. Subir Clave Pública a Meta
```bash
node upload-flow-key.js
```

### 3. Desplegar
```bash
docker-compose up -d
```

### 4. Validar en Meta Business Manager
- Ir a **WhatsApp Manager → Flows**
- Configurar endpoint: `https://tu-dominio.com/whatsapp_flow`
- Hacer clic en **Validate**

## 🔐 Arquivos Importantes

- `core/encryption.js` - Módulo de cifrado/descifrado
- `core/webhookHandler.js` - Manejo de webhooks y flows
- `private_key.pem` - Clave privada RSA (MANTENER SEGURA)
- `public_key.pem` - Clave pública RSA (subir a Meta)
- `upload-flow-key.js` - Script para subir clave a Meta
- `verificar-configuracion.js` - Verificación completa del sistema

## ⚙️ Variables de Entorno Requeridas

```bash
# WhatsApp Business API
WHATSAPP_TOKEN=tu_token_de_acceso
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_FLOW_WELCOME_ID=tu_flow_id

# Cifrado
WHATSAPP_FLOW_PRIVATE_KEY_FILE=/app/private_key.pem

# Webhook
VERIFY_TOKEN=tu_verify_token
```

## 🔍 Endpoint de Validación

Meta valida tu endpoint enviando:
```json
{
  "encrypted_flow_data": "...",
  "encrypted_aes_key": "...",
  "initial_vector": "..."
}
```

Que descifrado contiene:
```json
{
  "version": "3.0",
  "action": "ping"
}
```

**Tu endpoint DEBE responder exactamente:**
```json
{
  "data": {
    "status": "active"
  }
}
```

## 🐛 Solución de Problemas

### "La respuesta descifrada no es la esperada"
✅ **Solución**: Verificar que respondes `{"data": {"status": "active"}}` al ping

### "Private key mismatch"
✅ **Solución**: Generar nuevas claves y subir la pública a Meta

### "ERR_OSSL_RSA_OAEP_DECODING_ERROR"
✅ **Solución**: Verificar formato PEM de la clave privada

## 📊 Verificación del Estado

```bash
# Ver logs del contenedor
docker-compose logs -f

# Verificar endpoint
curl "https://tu-dominio.com/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=tu_token"

# Estado de cifrado en Meta
node upload-flow-key.js
```

## 🎉 ¡Configuración Exitosa!

Si ves estos logs durante la validación de Meta:

```
🔄 Detectada solicitud de Flow cifrada.
✅ Objeto de clave privada creado exitosamente
✅ Clave AES descifrada exitosamente
✅ Flow descifrado: {"version": "3.0", "action": "ping"}
✅ Respondiendo al ping de validación de Meta.
```

**¡Tu endpoint está funcionando correctamente!** 🚀

## 📞 Soporte

- 📖 **Documentación**: [GUIA-CONFIGURACION-FLOWS.md](./GUIA-CONFIGURACION-FLOWS.md)
- 🔍 **Verificación**: `node verificar-configuracion.js`
- 🧪 **Pruebas**: `node test-encryption.js`
- 📊 **Estado Meta**: `node upload-flow-key.js`

---

## 🗓️ Actualización: Flujo de Citas con WhatsApp Flows (v2.8.9)

### Cambios y Mejoras Recientes

- **Confirmación de Citas:**
  - El sistema ahora envía el mensaje de confirmación de cita siempre al número de WhatsApp que inició la conversación (no al número que el usuario escribe manualmente en el formulario).
  - Esto garantiza que la confirmación llegue al usuario correcto y evita errores por números mal escritos.

- **Validación de Email:**
  - Se agregó validación de formato de email en la pantalla de datos personales (DETAILS). Si el email no es válido, el usuario no puede avanzar.

- **Flujo de Pantallas:**
  - El flujo sigue la secuencia: `APPOINTMENT → DETAILS → SUMMARY → SUCCESS`.
  - El mensaje de confirmación se envía justo al confirmar en la pantalla SUMMARY, antes de mostrar SUCCESS.

- **Persistencia y Seguridad:**
  - El número de WhatsApp original se pasa de forma segura usando el `flow_token` en todo el proceso.
  - Los datos de la cita y del cliente se almacenan correctamente en MongoDB, siempre usando el número de WhatsApp real.

### Ejemplo de Experiencia para el Usuario

1. El usuario inicia el Flow desde WhatsApp.
2. Completa los datos de la cita y sus datos personales.
3. Al confirmar, recibe inmediatamente un mensaje de WhatsApp con los detalles y referencia de la cita.
4. El sistema valida el email y nunca envía confirmaciones a números distintos al de la conversación.

### Archivos Clave Modificados
- `core/webhookHandler.js` (manejo de número y validación email)
- `core/bot.js` (paso de número original como flow_token)
- `api/whatsapp.js` (soporte para flow_token)

---

**Esta actualización mejora la confiabilidad y experiencia del usuario en el agendamiento de citas por WhatsApp Flows.**

---

## ⚙️ Configuración Específica del Flujo de Citas

### 1. Activación del Flow
- El Flow de citas se activa automáticamente cuando el usuario solicita agendar una cita o usa palabras clave como "agendar", "cita", "consultar cita".
- El bot envía el Flow interactivo usando el ID configurado en la variable de entorno `WHATSAPP_FLOW_APPOINTMENT_ID`.

### 2. Estructura del Flow
- El flujo sigue la secuencia: `APPOINTMENT → DETAILS → SUMMARY → SUCCESS`.
- Cada pantalla recopila información clave:
  - **APPOINTMENT:** Servicio, sede, fecha y hora.
  - **DETAILS:** Nombre, email (validado), teléfono (prellenado con el número de WhatsApp), detalles adicionales.
  - **SUMMARY:** Resumen y confirmación de términos y privacidad.
  - **SUCCESS:** Mensaje de éxito y detalles de la cita.

### 3. Seguridad y Persistencia
- El número de WhatsApp original se pasa como `flow_token` y se usa en todo el proceso, garantizando que la confirmación llegue al usuario correcto.
- Todos los datos se almacenan en MongoDB, asociando la cita al número real de WhatsApp.

### 4. Validaciones
- El email es validado con una expresión regular antes de permitir la confirmación.
- El teléfono mostrado y usado para notificaciones siempre es el de la conversación de WhatsApp.

### 5. Variables de Entorno Clave

```env
WHATSAPP_FLOW_APPOINTMENT_ID=...   # ID del Flow de agendamiento en Meta
WHATSAPP_FLOW_PRIVATE_KEY_B64=...  # Clave privada en base64 para descifrado
WHATSAPP_TOKEN=...                 # Token de acceso API WhatsApp
WHATSAPP_PHONE_NUMBER_ID=...       # ID del número de WhatsApp
MONGO_URI=...                      # Cadena de conexión MongoDB
```

> **Nota:** No expongas nunca tus claves privadas ni tokens en documentación pública.

> **Privacidad:**
> - El sistema nunca expone datos personales sensibles en logs ni en la documentación.
> - Los ejemplos y mensajes de confirmación solo muestran información genérica (servicio, sede, fecha, hora, referencia).
> - Los datos personales reales (nombre, email, teléfono) solo se usan internamente para la gestión de la cita y nunca se comparten ni se muestran públicamente.

---