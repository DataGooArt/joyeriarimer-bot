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

**Desarrollado con ❤️ para WhatsApp Business API**