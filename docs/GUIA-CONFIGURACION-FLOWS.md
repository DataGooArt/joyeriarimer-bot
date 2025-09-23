# 📋 Guía Completa: Configuración de Endpoints para WhatsApp Flows

## 🎯 Resumen Ejecutivo
Esta guía documenta el proceso completo para configurar endpoints cifrados para WhatsApp Flows, desde la generación de claves RSA hasta la validación exitosa con Meta.

---

## 📚 Tabla de Contenidos
1. [Prerequisitos](#prerequisitos)
2. [Generación de Claves RSA](#generación-de-claves-rsa)
3. [Configuración del Código de Cifrado](#configuración-del-código-de-cifrado)
4. [Configuración del Endpoint](#configuración-del-endpoint)
5. [Subida de Clave Pública a Meta](#subida-de-clave-pública-a-meta)
6. [Despliegue y Configuración de Infraestructura](#despliegue-y-configuración-de-infraestructura)
7. [Validación del Endpoint](#validación-del-endpoint)
8. [Solución de Problemas Comunes](#solución-de-problemas-comunes)
9. [Verificación Final](#verificación-final)

---

## 🔧 Prerequisitos

### Herramientas Necesarias
- Node.js 18+
- Docker y Docker Compose
- Acceso a Meta Business Manager
- Token de acceso de WhatsApp Business API
- Dominio público con SSL (recomendado: Traefik + Let's Encrypt)

### Variables de Entorno Requeridas
```bash
WHATSAPP_TOKEN=tu_token_de_acceso
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_FLOW_WELCOME_ID=tu_flow_id
VERIFY_TOKEN=tu_verify_token
```

---

## 🔐 Generación de Claves RSA

### Opción 1: Usando OpenSSL (Linux/macOS)
```bash
# Generar clave privada RSA 2048-bit
openssl genrsa -out private_key.pem 2048

# Extraer clave pública
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### Opción 2: Usando Node.js (Windows/Cross-platform)
Crear archivo `generate-keys.js`:
```javascript
const crypto = require('crypto');
const fs = require('fs');

console.log('🔑 Generando par de claves RSA 2048-bit...');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Guardar claves en archivos
fs.writeFileSync('private_key.pem', privateKey);
fs.writeFileSync('public_key.pem', publicKey);

console.log('✅ Claves generadas exitosamente:');
console.log('📄 private_key.pem (MANTENER SEGURA)');
console.log('📄 public_key.pem (para subir a Meta)');
```

Ejecutar:
```bash
node generate-keys.js
```

---

## 💻 Configuración del Código de Cifrado

### 1. Módulo de Cifrado (`core/encryption.js`)

```javascript
'use strict';

const crypto = require('crypto');
const fs = require('fs');

class FlowEndpointException extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
    }
}

/**
 * Descifra el cuerpo de una solicitud de WhatsApp Flow
 */
function decryptRequest(body, privatePem) {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
        throw new Error('La solicitud encriptada no tiene el formato esperado.');
    }

    let decryptedAesKey;
    try {
        const privateKeyObject = crypto.createPrivateKey(privatePem);
        
        decryptedAesKey = crypto.privateDecrypt(
            {
                key: privateKeyObject,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(encrypted_aes_key, 'base64')
        );
    } catch (error) {
        // Código 421 le indica al cliente que debe refrescar la clave pública
        throw new FlowEndpointException(421, 'Fallo al descifrar la solicitud.');
    }

    const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
    const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

    const TAG_LENGTH = 16;
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

    const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVectorBuffer);
    decipher.setAuthTag(encrypted_flow_data_tag);

    const decryptedJSONString = Buffer.concat([
        decipher.update(encrypted_flow_data_body),
        decipher.final(),
    ]).toString('utf-8');

    return {
        decryptedBody: JSON.parse(decryptedJSONString),
        aesKeyBuffer: decryptedAesKey,
        initialVectorBuffer,
    };
}

/**
 * Cifra una respuesta para WhatsApp Flow
 */
function encryptResponse(response, aesKeyBuffer, initialVectorBuffer) {
    const flipped_iv = Buffer.from(initialVectorBuffer.map(b => 255 - b));
    const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, flipped_iv);

    const encryptedResponse = Buffer.concat([
        cipher.update(JSON.stringify(response), 'utf-8'),
        cipher.final(),
        cipher.getAuthTag(),
    ]);

    return encryptedResponse.toString('base64');
}

/**
 * Obtiene la clave privada desde archivo o variable de entorno
 */
function getPrivateKey() {
    // Prioridad: archivo -> Base64 -> variable de entorno
    const privateKeyFile = process.env.WHATSAPP_FLOW_PRIVATE_KEY_FILE;
    if (privateKeyFile && fs.existsSync(privateKeyFile)) {
        return fs.readFileSync(privateKeyFile, 'utf8');
    }
    
    const privateKeyB64 = process.env.WHATSAPP_FLOW_PRIVATE_KEY_B64;
    if (privateKeyB64) {
        return Buffer.from(privateKeyB64, 'base64').toString('utf8');
    }
    
    const privateKeyEnv = process.env.WHATSAPP_FLOW_PRIVATE_KEY;
    if (privateKeyEnv) {
        return privateKeyEnv.replace(/\\n/g, '\n');
    }
    
    throw new Error('No se encontró la clave privada');
}

module.exports = { decryptRequest, encryptResponse, FlowEndpointException, getPrivateKey };
```

### 2. Webhook Handler (`core/webhookHandler.js`)

```javascript
async function processWebhook(body) {
    // Detectar solicitudes de Flow cifradas
    if (body.encrypted_flow_data && body.encrypted_aes_key && body.initial_vector) {
        try {
            const privateKey = getPrivateKey();
            const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(body, privateKey);
            
            let response;
            
            if (decryptedBody.action === 'ping') {
                // CRÍTICO: Meta espera exactamente esta respuesta para validación
                response = {
                    data: {
                        status: "active"
                    }
                };
            } else {
                // Lógica para otras acciones del flow
                response = await handleFlowAction(decryptedBody);
            }
            
            // Cifrar y retornar respuesta
            const encryptedResponse = encryptResponse(response, aesKeyBuffer, initialVectorBuffer);
            return { encrypted_response: encryptedResponse };
            
        } catch (error) {
            if (error instanceof FlowEndpointException) {
                throw error; // Mantener códigos de estado específicos
            }
            throw new FlowEndpointException(500, 'Error interno del servidor');
        }
    }
    
    // Manejar otros tipos de webhook...
}
```

---

## 🌐 Configuración del Endpoint

### 1. Endpoint Principal (`index.js`)

```javascript
// Endpoint para WhatsApp Flows
app.post('/whatsapp_flow', async (req, res) => {
    try {
        const result = await processWebhook(req.body);
        res.json(result);
    } catch (error) {
        if (error instanceof FlowEndpointException) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});
```

### 2. Configuración de Infraestructura

#### Docker Compose (`docker-compose.yml`)
```yaml
services:
  joyeria-rimer-bot:
    image: tu-usuario/tu-bot:version
    environment:
      - WHATSAPP_FLOW_PRIVATE_KEY_FILE=/app/private_key.pem
      - WHATSAPP_TOKEN=tu_token
      - WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
      # ... otras variables
    volumes:
      - ./private_key.pem:/app/private_key.pem:ro
    networks:
      - tu_red_publica
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.tu-bot-https.rule=Host(\"tu-dominio.com\")"
      - "traefik.http.routers.tu-bot-https.entrypoints=websecure"
      - "traefik.http.routers.tu-bot-https.tls=true"
      - "traefik.http.routers.tu-bot-https.tls.certresolver=letsencryptresolver"
```

---

## 📤 Subida de Clave Pública a Meta

### Script de Configuración (`upload-flow-key.js`)

```javascript
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function uploadPublicKey() {
    try {
        const publicKey = fs.readFileSync('public_key.pem', 'utf8');
        
        console.log('🔐 Subiendo clave pública a Meta...');
        
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/whatsapp_business_encryption`,
            `business_public_key=${encodeURIComponent(publicKey)}`,
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('✅ Clave pública subida exitosamente!');
        console.log('📊 Respuesta:', response.data);
        
        // Verificar estado
        const statusResponse = await axios.get(
            `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/whatsapp_business_encryption`,
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`
                }
            }
        );
        
        console.log('🔍 Estado de la encriptación:', statusResponse.data);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

uploadPublicKey();
```

Ejecutar:
```bash
node upload-flow-key.js
```

**Resultado esperado:**
```json
{
  "success": true
}
```

---

## 🚀 Despliegue y Configuración de Infraestructura

### 1. Construcción y Despliegue

```bash
# 1. Construir imagen Docker
docker build -t tu-usuario/tu-bot:1.0.0 .

# 2. Subir a registro
docker push tu-usuario/tu-bot:1.0.0

# 3. Desplegar
docker-compose up -d

# 4. Verificar logs
docker-compose logs -f
```

### 2. Configuración de DNS
- Apuntar tu dominio al servidor
- Configurar Traefik para SSL automático con Let's Encrypt

### 3. Verificación de Conectividad

```bash
# Probar endpoint de verificación
curl "https://tu-dominio.com/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=tu_verify_token"

# Respuesta esperada: test123
```

---

## ✅ Validación del Endpoint

### 1. En Meta Business Manager

1. Ir a **WhatsApp Manager → Flows**
2. Seleccionar tu Flow
3. En **Configuration → Endpoint**, introducir:
   - **URL**: `https://tu-dominio.com/whatsapp_flow`
4. Hacer clic en **Validate**

### 2. Proceso de Validación de Meta

Meta enviará un request cifrado con:
```json
{
  "encrypted_flow_data": "...",
  "encrypted_aes_key": "...", 
  "initial_vector": "..."
}
```

Que al descifrarse contendrá:
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

### 3. Logs de Validación Exitosa

```
🔄 Detectada solicitud de Flow cifrada.
🔐 Intentando crear objeto de clave privada...
✅ Objeto de clave privada creado exitosamente
🔓 Descifrando clave AES...
✅ Clave AES descifrada exitosamente
✅ Flow descifrado: {
  "version": "3.0",
  "action": "ping"
}
✅ Respondiendo al ping de validación de Meta.
```

---

## 🔧 Solución de Problemas Comunes

### Error: "Private key mismatch"
**Causa**: La clave privada local no corresponde a la clave pública en Meta.

**Solución**:
1. Generar nuevo par de claves
2. Subir la nueva clave pública a Meta
3. Actualizar la clave privada en el servidor

### Error: "ERR_OSSL_RSA_OAEP_DECODING_ERROR"
**Causa**: Problema con el cifrado RSA.

**Solución**:
1. Verificar formato de la clave privada (PEM)
2. Confirmar que la clave sea RSA 2048-bit
3. Verificar que no haya caracteres extraños en la clave

### Error: "La respuesta descifrada no es la esperada"
**Causa**: Respuesta incorrecta al ping de validación.

**Solución**:
```javascript
// CORRECTO para ping:
if (decryptedBody.action === 'ping') {
    response = {
        data: {
            status: "active"
        }
    };
}

// INCORRECTO:
// response = {
//     version: "3.0",
//     screen: "SUCCESS", 
//     data: {}
// };
```

### Error: Network timeout
**Causa**: Meta no puede alcanzar tu endpoint.

**Solución**:
1. Verificar que el dominio esté público
2. Confirmar certificado SSL válido
3. Verificar que el puerto sea accesible

---

## 🎯 Verificación Final

### Checklist Completo

- [ ] **Claves RSA generadas** (2048-bit)
- [ ] **Clave pública subida a Meta** (estado: VALID)
- [ ] **Clave privada configurada en servidor**
- [ ] **Código de cifrado implementado**
- [ ] **Endpoint configurado** (`/whatsapp_flow`)
- [ ] **Respuesta correcta a ping** (`{"data": {"status": "active"}}`)
- [ ] **SSL configurado** (certificado válido)
- [ ] **Dominio público accesible**
- [ ] **Logs sin errores**
- [ ] **Validación de Meta exitosa**

### Test de Cifrado Local

```bash
# Ejecutar script de prueba
node test-encryption.js
```

**Resultado esperado:**
```
🎉 ¡PRUEBA EXITOSA! El cifrado/descifrado funciona perfectamente
```

### Verificación en Producción

1. Meta valida endpoint: **✅ SUCCESS**
2. Logs muestran ping descifrado correctamente
3. Respuesta cifrada enviada sin errores
4. Estado de encriptación en Meta: **VALID**

---

## 📝 Notas Importantes

### Seguridad
- **NUNCA** expongas la clave privada en logs o código
- Usa variables de entorno o montaje de archivos
- Mantén las claves en un almacén seguro

### Mantenimiento
- Monitorea logs regularmente
- Rota claves según políticas de seguridad
- Mantén backups seguros de las claves

### Escalabilidad
- Considera usar un HSM para claves en producción
- Implementa balanceadores de carga si es necesario
- Monitorea métricas de rendimiento

---

## 🎉 ¡Felicitaciones!

Si has seguido todos los pasos y tu endpoint pasa la validación de Meta, tienes un sistema completamente funcional de WhatsApp Flows con cifrado end-to-end. Tu bot ahora puede:

- ✅ Recibir datos cifrados de WhatsApp Flows
- ✅ Descifrar requests usando RSA-OAEP + AES-GCM
- ✅ Procesar la lógica de negocio
- ✅ Cifrar y enviar respuestas de vuelta
- ✅ Manejar validaciones de Meta automáticamente

**¡Tu implementación está lista para producción!** 🚀

---

## 📞 Soporte

Para problemas específicos:
1. Revisar logs del contenedor
2. Verificar estado de claves en Meta
3. Probar cifrado local con script de test
4. Consultar documentación oficial de Meta

**Documentación oficial**: https://developers.facebook.com/docs/whatsapp/flows/