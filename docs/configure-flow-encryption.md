# Configuración Manual de WhatsApp Flow Encryption

## Problema Identificado

El token de acceso actual no tiene los permisos necesarios para configurar la encriptación de WhatsApp Flows automáticamente. Esto es normal ya que requiere permisos especiales de sistema.

## Solución Manual

### Opción 1: Usar cURL directamente (Recomendado)

```bash
curl -X POST \
  "https://graph.facebook.com/v23.0/1333485894858619/whatsapp_business_encryption" \
  -H "Authorization: Bearer TU_TOKEN_DE_SISTEMA" \
  -H "Content-Type: application/json" \
  -d '{
    "business_public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAubKiAFOUL9vvAsQKop/6\nnvwLrOAkeUsy6dUSqrxPPbQIAUm+52yBcnL0b7ox1QD8VKYvPW2UInxSNYV29Zyg\nrJBuQZD86qlrjixhX5FuiDWzIYQvbLlawJJk3cmD4nuuW6Q+e3x29lYuVgrmZZJT\noI7oHM9aDSrv83M2q+RfyA/Z5zWTyU/mVEwPvMFqGQ3EC/89Yg7OdZzsCriGBDYZ\nrq7LJXZI3rgSyHxj43UDMJuixQ4yAcSBLUNfaRJla+Ztd2/Dg/k6DKZaAcbItpy0\nVhwA6qKX/PZcO4Ho8x8dQDStfBrWxWAG1yu+CNLlwfaXTJNFQGikydfBHiycOtBC\nawIDAQAB\n-----END PUBLIC KEY-----"
  }'
```

### Opción 2: Configurar desde Meta Business Manager

1. **Accede a Meta Business Manager**: https://business.facebook.com/
2. **Navega a WhatsApp Manager**: Configuración de la cuenta > WhatsApp Business API
3. **Busca la sección "Flows"** o "Encriptación"
4. **Sube la clave pública** en el área correspondiente

### Opción 3: Crear un System User Token

Para automatizar el proceso, necesitas crear un System User Token con permisos específicos:

#### Pasos:
1. Ve a **Business Settings** en Meta Business Manager
2. Selecciona **System Users** en el menú lateral
3. Crea un nuevo System User o selecciona uno existente
4. Asigna los siguientes permisos:
   - `whatsapp_business_encryption`
   - `whatsapp_business_management`
5. Genera un token de acceso permanente
6. Actualiza la variable `WHATSAPP_TOKEN` en tu `.env`

## Tu Clave Pública

Aquí está tu clave pública formateada para la API:

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAubKiAFOUL9vvAsQKop/6
nvwLrOAkeUsy6dUSqrxPPbQIAUm+52yBcnL0b7ox1QD8VKYvPW2UInxSNYV29Zyg
rJBuQZD86qlrjixhX5FuiDWzIYQvbLlawJJk3cmD4nuuW6Q+e3x29lYuVgrmZZJT
oI7oHM9aDSrv83M2q+RfyA/Z5zWTyU/mVEwPvMFqGQ3EC/89Yg7OdZzsCriGBDYZ
rq7LJXZI3rgSyHxj43UDMJuixQ4yAcSBLUNfaRJla+Ztd2/Dg/k6DKZaAcbItpy0
VhwA6qKX/PZcO4Ho8x8dQDStfBrWxWAG1yu+CNLlwfaXTJNFQGikydfBHiycOtBC
awIDAQAB
-----END PUBLIC KEY-----
```

## Datos de tu configuración

- **WABA ID**: `1333485894858619`
- **Endpoint**: `https://graph.facebook.com/v23.0/1333485894858619/whatsapp_business_encryption`
- **Método**: `POST`

## Verificar configuración

Una vez configurada la clave, verifica con:

```bash
curl -X GET \
  "https://graph.facebook.com/v23.0/1333485894858619/whatsapp_business_encryption" \
  -H "Authorization: Bearer TU_TOKEN_CON_PERMISOS"
```

## Next Steps

1. Configura la clave pública usando una de las opciones arriba
2. Actualiza tu Flow JSON para incluir la configuración del endpoint
3. Prueba el Flow con datos reales

## Documentación Oficial

- [WhatsApp Business Encryption Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-encryption)
- [Implementing Flow Endpoints](https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint)