# 💎 Bot de WhatsApp IA para Joyería Rimer

Sistema de **IA conversacional avanzado** con **WhatsApp Flows** integrado para Joyería Rimer. Incluye detección automática de intenciones, sistema de citas interactivo, catálogo con botones, y gestión completa de leads.

## ✨ Características Principales

### 🤖 **IA Conversacional con Detección de Intenciones**
*   **Google Gemini AI:** Procesamiento de lenguaje natural para conversaciones fluidas
*   **Detección Automática:** Reconoce intención de agendar citas automáticamente
*   **Activación de Flows:** Lanza WhatsApp Flows interactivos según el contexto
*   **Memoria Contextual:** Recuerda conversaciones previas y preferencias del cliente
*   **Lead Scoring:** Evalúa automáticamente la calidad del prospecto (1-10)

### 📅 **Sistema de Citas AI con WhatsApp Flows**
*   **Flow ID 24509326838732458:** Flow interactivo de citas validado por Meta
*   **Detección Inteligente:** AI detecta palabras como "cita", "reservar", "appointment"
*   **Activación Automática:** Lanza el Flow sin intervención manual
*   **Ubicaciones:** Cartagena y Santa Marta con servicios específicos
*   **Notificaciones:** Confirmaciones automáticas y recordatorios programados
*   **Encriptación RSA-2048:** Seguridad completa en comunicaciones

### 🛍️ **Catálogo Interactivo con Botones**
*   **Navegación por Categorías:** Anillos, Cadenas, Aretes con botones interactivos
*   **Visualización de Productos:** Imágenes, precios, descripciones detalladas
*   **Integración con Citas:** Opción "Agendar Cita" dentro del catálogo
*   **Flujo Intuitivo:** Categorías → Productos → Detalles → Citas

### 📋 **Sistema de Leads y CRM Automatizado**
*   **Captura Automática:** Datos de citas, contacto, preferencias, presupuesto
*   **Historial Completo:** Todas las interacciones y citas en MongoDB Atlas
*   **Seguimiento:** Estado de conversaciones, citas y oportunidades
*   **Notificaciones:** Sistema cron para recordatorios y confirmaciones

### � **Arquitectura de Seguridad Meta-Validada**
*   **HMAC-SHA256:** Verificación de webhooks con Meta
*   **RSA-2048:** Encriptación de WhatsApp Flows
*   **Endpoint Validado:** Certificado por Meta Business Manager
*   **Docker Security:** Contenedores seguros con secrets management

## 🛠️ Tecnologías Utilizadas (Tech Stack)

*   **Backend:** Node.js v18+, Express.js
*   **IA:** Google Gemini Pro API para detección de intenciones
*   **WhatsApp Flows:** API v23.0 con RSA-2048 encryption
*   **Base de Datos:** MongoDB Atlas con Mongoose ODM
*   **Seguridad:** HMAC-SHA256, RSA encryption, Meta validation
*   **Automatización:** Node-cron para notificaciones programadas
*   **Contenerización:** Docker, Docker Compose con multi-stage builds
*   **Monitoreo:** Logs estructurados, error tracking, health checks

## 📁 Estructura del Proyecto

```
whatsapp-joyeria/
├── 📁 api/                    # Endpoints de WhatsApp
├── 📁 assets/                 # Imágenes y recursos estáticos
├── 📁 core/                   # Lógica principal del bot
│   ├── bot.js                # IA conversacional + detección intenciones
│   ├── encryption.js         # RSA encryption para Flows
│   └── webhookHandler.js     # HMAC verification + ping responses
├── 📁 docs/                   # Documentación técnica
├── 📁 models/                 # Modelos de MongoDB
├── 📁 services/              # Servicios de negocio
│   ├── appointmentService.js # Sistema de citas con Flows
│   ├── notificationService.js# Notificaciones automáticas
│   └── whatsappService.js    # API WhatsApp wrapper
├── 📁 tests/                 # Archivos de prueba y validación
├── docker-compose.yml        # Configuración producción
└── index.js                 # Servidor principal con HMAC
```

## 🚀 Instalación y Configuración

### Prerrequisitos

*   **Node.js v18+** y npm
*   **Docker** y **Docker Compose** 
*   **MongoDB Atlas** (recomendado)
*   **WhatsApp Business Account** con Cloud API
*   **Google Gemini API Key** ([obtener aquí](https://makersuite.google.com/app/apikey))
*   **Meta Business Manager** para configurar Flows
*   **Dominio SSL** (para webhooks de producción)

### 📋 Configuración Rápida

1.  **Clonar e instalar:**
    ```bash
    git clone https://github.com/DataGooArt/joyeriarimer-bot.git
    cd whatsapp-joyeria
    npm install
    ```

2.  **Configurar variables (.env):**
    ```bash
    # WhatsApp Business API
    WHATSAPP_TOKEN=your_permanent_token
    WHATSAPP_PHONE_ID=your_phone_number_id
    WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
    
    # IA y Servicios
    GOOGLE_AI_KEY=your_gemini_api_key
    MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/joyeria
    
    # WhatsApp Flows (Requerido para citas)
    FLOW_PRIVATE_KEY_PATH=./private_key.pem
    FLOW_ID=24509326838732458
    ```

3.  **Inicializar base de datos:**
    ```bash
    npm run setup        # Poblar productos y configurar DB
    ```

## 🎯 Modos de Ejecución

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