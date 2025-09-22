# 💎 Bot de WhatsApp para Joyería Rimer

Este proyecto es un **agente de IA conversacional avanzado** para WhatsApp, diseñado específicamente para la Joyería Rimer. El bot proporciona una experiencia de compra personalizada, catálogo interactivo con botones, y sistema de leads inteligente.

## ✨ Características Principales

### 🤖 **IA Conversacional Avanzada**
*   **Google Gemini AI:** Procesamiento de lenguaje natural para conversaciones fluidas
*   **Memoria Contextual:** Recuerda conversaciones previas y preferencias del cliente
*   **Detección de Intenciones:** Clasifica automáticamente consultas (productos, cotizaciones, citas, etc.)
*   **Lead Scoring:** Evalúa automáticamente la calidad del prospecto (1-10)

### 🛍️ **Catálogo Interactivo con Botones**
*   **Navegación por Categorías:** Anillos, Cadenas, Aretes con botones interactivos
*   **Visualización de Productos:** Imágenes, precios, descripciones detalladas
*   **Acceso Inmediato:** Detección de palabras clave para mostrar catálogo instantáneamente
*   **Flujo Intuitivo:** Categorías → Productos → Detalles → Acciones

### 📋 **Sistema de Leads y CRM**
*   **Captura Automática:** Datos de contacto, preferencias, presupuesto
*   **Historial Completo:** Todas las interacciones almacenadas en MongoDB
*   **Seguimiento:** Estado de conversaciones y oportunidades de venta
*   **Transferencia a Humano:** Sistema de escalación cuando es necesario

### 🚀 **Flujo de Bienvenida Personalizado**
*   **WhatsApp Flow Interactive:** Términos y condiciones con UI nativa
*   **Mensaje Template:** Bienvenida automática con imagen de marca
*   **Onboarding Guiado:** Presenta opciones y funcionalidades disponibles

### 🔧 **Arquitectura Empresarial**
*   **Contenedorización:** Docker con multi-stage builds optimizados
*   **Escalabilidad:** Ready para réplicas y balanceadores de carga
*   **Monitoreo:** Logs estructurados y manejo de errores
*   **Seguridad:** Variables de entorno y certificados SSL/TLS

## 🛠️ Tecnologías Utilizadas (Tech Stack)

*   **Backend:** Node.js, Express.js
*   **IA:** Google Gemini Pro API
*   **Base de Datos:** MongoDB Atlas con Mongoose ODM
*   **Mensajería:** WhatsApp Business Cloud API
*   **Contenerización:** Docker, Docker Compose
*   **Proxy Inverso:** Traefik con Let's Encrypt
*   **Seguridad:** Webhook verification, JWT, HTTPS
*   **Monitoreo:** Structured logging, error tracking

## 🚀 Puesta en Marcha

### Prerrequisitos

*   **Node.js** (v18 o superior)
*   **Docker** y **Docker Compose**
*   **MongoDB Atlas** (recomendado) o instancia local
*   **WhatsApp Business Account** con API Cloud activada
*   **Google Gemini API Key** ([obtener aquí](https://makersuite.google.com/app/apikey))
*   **Dominio** con certificado SSL (para producción)

### 📋 Configuración Inicial

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/DataGooArt/joyeriarimer-bot.git
    cd joyeriarimer-bot
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    ```bash
    # Copiar plantilla de ejemplo
    cp .env.example .env
    # Editar con tus credenciales
    nano .env
    ```

4.  **Poblar base de datos con productos:**
    ```bash
    node add-products.js
    ```

## 🎯 Modos de Ejecución

### 🧪 **Modo Simulación** (Desarrollo rápido)
Perfecto para probar la lógica del bot sin configurar WhatsApp:

```bash
node local-chat.js
```

### 🐳 **Modo Docker Local**
```bash
docker-compose -f docker-compose.local.yml up --build
```

### 🚀 **Modo Producción**

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

## 💬 Cómo Opera el Bot

### 🔄 **Flujo de Conversación**

1. **Primer Contacto**
   - Mensaje de bienvenida automático con WhatsApp Flow
   - Aceptación de términos y condiciones
   - Presentación de opciones disponibles

2. **Navegación del Catálogo**
   - Usuario escribe: `"ver catálogo"`, `"productos"`, `"opciones"`
   - Bot muestra **categorías con botones interactivos**:
     - 💍 **Anillos** → Compromiso, Matrimonio, Moda
     - 🔶 **Cadenas** → Oro, Plata, Acero inoxidable  
     - 💎 **Aretes** → Perlas, Diamantes, Diseños únicos

3. **Selección de Productos**
   - Usuario hace clic en categoría → Muestra productos con imágenes
   - Clic en producto → Detalles completos + opciones de acción
   - **Acciones disponibles**: Ver más, Cotizar, Apartar, Agendar cita

4. **Conversación con IA**
   - Preguntas específicas procesadas por Gemini
   - Respuestas contextuales basadas en historial
   - Captura automática de información (nombre, preferencias, presupuesto)

5. **Gestión de Leads**
   - Scoring automático de calidad del prospecto (1-10)
   - Almacenamiento de toda interacción en MongoDB
   - Transferencia a agente humano cuando es necesario

### 🎯 **Palabras Clave para Activación Inmediata**

El bot detecta estas frases y muestra el catálogo **instantáneamente**:
- `"ver catálogo"` / `"catalogo"`
- `"ver productos"` / `"productos"`  
- `"mostrar joyas"` / `"opciones"`
- `"quiero ver"` / `"muéstrame"`

### 📊 **Sistema de Inteligencia**

- **Clasificación de Intenciones**: Saludo, Consulta, Cotización, Cita, Transferencia
- **Lead Scoring**: Evaluación automática 1-10 basada en engagement
- **Memoria Contextual**: Recuerda conversaciones previas y preferencias
- **Escalación Inteligente**: Detecta cuándo transferir a humano

## 🧰 Scripts y Herramientas

### Scripts de Configuración
```bash
# Poblar productos en base de datos
node add-products.js

# Probar envío de mensajes
node send-test.js  

# Probar templates personalizados
node send-custom-template.js
```

### Scripts de Desarrollo
```bash
# Chat local para testing
node local-chat.js

# Pruebas de intervalos y cron jobs
node interval-test.js

# Configurar túnel para desarrollo
node start-tunnel.js
```

## 🔑 Variables de Entorno Esenciales

### **MongoDB**
```env
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/joyeria_db
```

### **Google Gemini AI**
```env
GEMINI_API_KEY=AIzaSy...tu-api-key
```

### **WhatsApp Business API**
```env
WHATSAPP_TOKEN=EAAKwatcBYGc...tu-token-permanente
WHATSAPP_PHONE_NUMBER_ID=123456789012345
VERIFY_TOKEN=tu-webhook-verify-token
```

### **WhatsApp Flows (Opcional)**
```env
WHATSAPP_FLOW_WELCOME_ID=1234567890123456
WHATSAPP_FLOW_TEMPLATE_NAMESPACE=bienvenida_con_terminos
WHATSAPP_FLOW_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
WELCOME_TEMPLATE_HEADER_IMAGE_URL=https://tu-imagen.com/header.jpg
```

### **Configuración Adicional**
```env
PORT=1337
NODE_ENV=production
DISABLE_FLOWS=false  # true para deshabilitar flows
```

## 🏗️ Arquitectura del Sistema

### **Estructura de Archivos**
```
📁 joyeria-rimer-bot/
├── 📁 api/
│   └── whatsapp.js          # 🔌 Integración WhatsApp API + Catálogo
├── 📁 core/
│   ├── bot.js               # 🤖 Lógica principal del bot
│   ├── prompts.js           # 💭 Prompts de IA + Protocolo
│   ├── webhookHandler.js    # 📨 Procesamiento de webhooks
│   └── encryption.js        # 🔐 Cifrado para WhatsApp Flows
├── 📁 services/
│   ├── aiService.js         # 🧠 Google Gemini integration
│   ├── dbService.js         # 🗄️ MongoDB operations
│   └── whatsappService.js   # 📱 WhatsApp Cloud API
├── 📁 models/
│   ├── Customer.js          # 👤 Modelo de cliente
│   ├── ChatSession.js       # 💬 Sesiones de chat
│   └── MessageLog.js        # 📝 Log de mensajes
└── 📁 book-appointment/     # 📅 Microservicio de citas
```

### **Flujo de Datos**
```mermaid
graph TD
    A[WhatsApp User] -->|Mensaje| B[Webhook Handler]
    B --> C{Tipo de Mensaje}
    C -->|Texto| D[Detección Keywords]
    C -->|Botón| E[Button Handler]
    D -->|Catálogo| F[Mostrar Categorías]
    D -->|Otro| G[Procesamiento IA]
    E --> H[Acción de Botón]
    F --> I[Respuesta al Usuario]
    G --> J[Gemini AI]
    J --> K[Generar Respuesta]
    K --> I
    H --> I
    I --> L[Almacenar en MongoDB]
    L --> A
```

## 🔧 Troubleshooting

### **Problemas Comunes**

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

### **Logs y Monitoreo**

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

## 🚀 Roadmap y Mejoras Futuras

### **Versión 2.1** (Próxima)
- [ ] Panel de administración web
- [ ] Analytics y métricas de conversación
- [ ] Integración con sistema de inventario
- [ ] Notificaciones push para administradores

### **Versión 2.2**
- [ ] Multiidioma (Inglés/Español)
- [ ] Bot voice messages
- [ ] Integración con CRM empresarial
- [ ] Sistema de cupones y descuentos

### **Versión 3.0**
- [ ] AI Visual para análisis de imágenes de productos
- [ ] Realidad aumentada para prueba de joyas
- [ ] Integración con múltiples canales (Instagram, Facebook)
- [ ] Sistema de recomendaciones personalizadas

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/DataGooArt/joyeriarimer-bot/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/DataGooArt/joyeriarimer-bot/wiki)
- **Email**: desarrollo@tallerdejoyeriarimer.com

---

**Desarrollado con ❤️ para Joyería Rimer** | **Versión actual: 2.0.5** | **© 2025**