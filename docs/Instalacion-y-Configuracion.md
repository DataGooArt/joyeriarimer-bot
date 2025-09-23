# 🚀 Instalación y Configuración

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
