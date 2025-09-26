# Bot de WhatsApp para Joyería Rimer

Este proyecto es un agente de IA conversacional para WhatsApp, diseñado para la Joyería Rimer. El bot es capaz de interactuar con los clientes, responder preguntas sobre productos, recolectar información de contacto, agendar citas mediante WhatsApp Flows, y mantener un historial de las conversaciones para ofrecer una experiencia personalizada.

## ✨ Características Principales

*   **Conversaciones con IA:** Utiliza Google Gemini para entender y generar respuestas en lenguaje natural.
*   **Memoria Persistente:** Almacena el historial de conversaciones y datos del cliente en una base de datos MongoDB.
*   **Catálogo de Productos:** Gestiona un inventario de productos en la base de datos y puede mostrarlos a los clientes.
*   **WhatsApp Flows:** Sistema de agendamiento de citas mediante Flows interactivos con cifrado RSA.
*   **Detección de Intenciones:** Clasifica la intención del usuario incluyendo agendamiento de citas y automáticamente activa el Flow correspondiente.
*   **Mensajería Interactiva:** Envía listas de productos, botones y Flows para una mejor experiencia de usuario.
*   **Sistema de Citas:** Agendamiento completo con servicios (tasación, reparación, diseño personalizado, compra presencial), ubicaciones, fechas y horarios disponibles.
*   **Listo para Producción:** Configurado para ser desplegado fácilmente con Docker, Docker Compose y Traefik como proxy inverso.
*   **Entorno de Simulación Local:** Incluye un simulador de chat para desarrollar y probar la lógica del bot sin necesidad de un webhook de WhatsApp.
*   **Suite de Tests Completa:** Tests organizados para validar Flow, detección de intención y integración completa.

## 🛠️ Tecnologías Utilizadas (Tech Stack)

*   **Backend:** Node.js, Express.js
*   **IA:** Google Gemini API
*   **Base de Datos:** MongoDB con Mongoose
*   **WhatsApp Flows:** RSA encryption/decryption, HMAC-SHA256 verification
*   **Contenerización:** Docker, Docker Compose
*   **Proxy Inverso (Producción):** Traefik
*   **Mensajería:** WhatsApp Cloud API

## 🚀 Puesta en Marcha

### Prerrequisitos

*   Node.js (v18 o superior)
*   Docker y Docker Compose
*   Una cuenta de MongoDB Atlas (o una instancia local de MongoDB)
*   Credenciales de la API de WhatsApp Cloud y de Google Gemini
*   WhatsApp Flow configurado en Meta Business Manager

### Instalación

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
    Crea un archivo `.env` en la raíz del proyecto. Puedes usar el archivo `.env.example` como plantilla. Rellena todas las variables con tus credenciales.

4.  **Configurar WhatsApp Flow:**
    - Configura el Flow en Meta Business Manager usando `flow-config.json`
    - Genera las claves RSA para cifrado: `node generate-keys.js`
    - Configura el endpoint de webhook en Meta: `/webhook/appointment-flow`

### Ejecución

#### Modo Simulación (Recomendado para desarrollo rápido)

Este modo te permite chatear con el bot directamente en tu terminal, sin necesidad de WhatsApp.

```bash
node local-chat.js
```

#### Modo Desarrollo con Docker

Usa Docker para construir y ejecutar el bot en un entorno aislado en tu PC.

```bash
docker-compose -f docker-compose.local.yml up --build
```

#### Modo Producción (VPS con Portainer/Traefik)

1.  **Construye y sube la imagen a Docker Hub:**
    ```bash
    # Construir la imagen v2.3.0
    docker build -t racuello/joyeria-rimer-bot:2.3.0 .
    # Iniciar sesión en Docker Hub
    docker login
    # Subir la imagen
    docker push racuello/joyeria-rimer-bot:2.3.0
    ```
2.  Despliega el stack usando el nuevo docker-compose: `docker-compose -f docker-compose.v2.3.0.yml up -d`

## 🧪 Testing

### Tests de WhatsApp Flow

El proyecto incluye una suite completa de tests para validar el sistema de agendamiento de citas:

#### Test Rápido (Recomendado)
```bash
# Verificación rápida sin envío de mensajes
node tests/flow/test-quick-verification.js
```

#### Test de Integración Completa
```bash
# ⚠️ ENVÍA FLOWS REALES a WhatsApp
node tests/flow/test-master-integration.js
```

#### Tests Específicos
```bash
# Test del endpoint de data_exchange
node tests/flow/test-endpoint.js

# Test de Flow con datos dinámicos
node tests/flow/test-flow-with-data.js
```

**Documentación completa:** Ver `tests/flow/README.md`

### Orden Recomendado
1. `test-quick-verification.js` - Verificar configuración
2. `test-endpoint.js` - Probar endpoint aislado
3. `test-master-integration.js` - Test completo con envío real

## 🚀 Despliegue Automatizado

### Usando Scripts de Despliegue

**Windows:**
```cmd
deploy-v2.3.0.bat
```

**Linux/Mac:**
```bash
chmod +x deploy-v2.3.0.sh
./deploy-v2.3.0.sh
```

Los scripts automáticamente:
1. Ejecutan tests de verificación
2. Construyen imagen Docker v2.3.0
3. Opcionalmente suben a Docker Hub
4. Despliegan usando docker-compose

## 🧰 Scripts Útiles

*   **Poblar la base de datos:** Para añadir los productos de ejemplo a tu base de datos MongoDB, ejecuta este script una vez:
    ```bash
    node add-products.js
    ```
    
*   **Configurar WhatsApp Flow:**
    ```bash
    # Generar claves RSA para cifrado
    node generate-keys.js
    
    # Configurar Flow en Meta Business Manager
    node setup-whatsapp-flow.js
    ```

## 🔑 Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

*   `MONGO_URI`: Cadena de conexión a tu base de datos MongoDB.
*   `GEMINI_API_KEY`: Tu clave de la API de Google Gemini.
*   `WHATSAPP_TOKEN`: Token de acceso permanente de la API de WhatsApp.
*   `WHATSAPP_PHONE_NUMBER_ID`: ID del número de teléfono de tu cuenta de WhatsApp Business.
*   `TO_PHONE_NUMBER`: Número de teléfono de prueba para enviar mensajes.
*   `CHATWOOT_URL`: (Opcional) URL de tu instancia de Chatwoot.
*   `CHATWOOT_ACCOUNT_ID`: (Opcional) ID de tu cuenta de Chatwoot.
*   `CHATWOOT_API_TOKEN`: (Opcional) Token de API de tu agente de Chatwoot.
*   `CHATWOOT_INBOX_ID`: (Opcional) ID de tu bandeja de entrada de WhatsApp en Chatwoot.