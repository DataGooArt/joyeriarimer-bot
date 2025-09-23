# 🔄 Guía: Actualizar WhatsApp Flow en Meta Business Manager

## 📋 Preparativos

### ✅ Datos que necesitas tener listos:
- **Flow ID actual:** `24509326838732458`
- **JSON del Flow:** `flow-config-meta.json` (en la raíz del proyecto)
- **Endpoint URL:** Tu dominio público (ej: `https://tu-dominio.com/webhook`)
- **Clave pública RSA:** `public_key.pem`

## 🚀 Pasos para Actualizar el Flow

### 1️⃣ **Acceder a Meta Business Manager**
```
https://business.facebook.com/
```
- Inicia sesión con tu cuenta
- Selecciona tu Business Account
- Ve a **"WhatsApp Manager"**

### 2️⃣ **Localizar el Flow Existente**
- En el menú izquierdo: **"Flows"**
- Busca el Flow con ID: **24509326838732458**
- Haz clic en **"Editar"**

### 3️⃣ **Actualizar el JSON del Flow**
- En la pestaña **"JSON"** o **"Código"**
- **COPIA TODO** el contenido de `flow-config-meta.json`
- **PEGA** el nuevo JSON (reemplaza completamente el anterior)
- Verifica que no hay errores de sintaxis

### 4️⃣ **Validar el Endpoint**
- Ve a la pestaña **"Endpoint"**
- Confirma que tu URL está configurada: `https://tu-dominio.com/webhook`
- Asegúrate de que el endpoint responde con status **200 OK**

### 5️⃣ **Verificar la Clave Pública**
- En **"Encryption Settings"** o **"Configuración de Cifrado"**
- Confirma que la clave RSA pública está cargada
- Si necesitas recargarla, usa el contenido de `public_key.pem`

### 6️⃣ **Probar el Flow**
- Haz clic en **"Preview"** o **"Vista Previa"**
- Prueba cada pantalla:
  - ✅ APPOINTMENT: Servicios de joyería aparecen
  - ✅ DETAILS: Formulario de contacto funciona  
  - ✅ SUMMARY: Resumen se muestra correctamente
  - ✅ SUCCESS: Mensaje de confirmación aparece

### 7️⃣ **Guardar y Publicar**
- Haz clic en **"Save"** o **"Guardar"**
- Luego en **"Publish"** o **"Publicar"**
- Espera la confirmación de que el Flow está activo

## 🧪 Validar que Funciona

### Desde WhatsApp:
1. Envía un mensaje a tu número de WhatsApp Business
2. Escribe: **"Quiero agendar una cita"**
3. El bot debería activar automáticamente el Flow actualizado
4. Verifica que aparecen los servicios de joyería:
   - 💎 Tasación de Joyas
   - ✨ Diseño Personalizado  
   - 🔧 Reparación de Joyas
   - 🛍️ Asesoría de Compra
   - ✨ Limpieza y Mantenimiento

### Desde tu Sistema:
```bash
# Ver citas en el dashboard
npm run dashboard:pending

# Validar que se guardó en MongoDB
node tools/appointment-dashboard.js stats
```

## 🔧 Troubleshooting

### ❌ **Error: "Invalid JSON format"**
**Solución:** Verifica que el JSON esté bien formateado
```bash
# Validar JSON localmente
node -e "console.log(JSON.parse(require('fs').readFileSync('flow-config-meta.json', 'utf8')))"
```

### ❌ **Error: "Endpoint not responding"**
**Solución:** Verificar que tu servidor está corriendo
```bash
# Probar endpoint
curl -X GET "https://tu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=tu_token&hub.challenge=test"
```

### ❌ **Error: "Encryption key mismatch"**
**Solución:** Re-subir la clave pública
```bash
# Generar nuevas claves si es necesario
node generate-keys.js
```

## 📊 Cambios Principales del Flow Actualizado

### ✨ **Nuevas Características:**
- **Servicios específicos de joyería** (en lugar de departamentos genéricos)
- **Ubicaciones reales:** Cartagena y Santa Marta
- **Términos y condiciones personalizados** para Joyería Rimer
- **Pantalla de éxito mejorada** con información de la cita
- **Textos en español** optimizados para el público colombiano

### 🔄 **Campos que se mapean a MongoDB:**
- `department` → `serviceType` (tasacion, diseño_personalizado, etc.)
- `location` → `location` (cartagena, santa_marta)
- `date` → `dateTime` (fecha seleccionada)
- `time` → `dateTime` (hora seleccionada) 
- `name` → `customer.name`
- `email` → `customerEmail`
- `phone` → `customer.phone`
- `more_details` → `customerNotes`

## ✅ **Resultado Esperado**
Después de actualizar, el Flow debe:
1. ✅ Mostrar servicios de joyería específicos
2. ✅ Permitir seleccionar Cartagena o Santa Marta
3. ✅ Mostrar fechas y horarios disponibles dinámicamente
4. ✅ Capturar información completa del cliente
5. ✅ Guardar automáticamente en MongoDB
6. ✅ Enviar confirmación con referencia única
7. ✅ Activar sistema de recordatorios automáticos

¡El Flow estará listo para recibir citas reales de Joyería Rimer! 💎✨