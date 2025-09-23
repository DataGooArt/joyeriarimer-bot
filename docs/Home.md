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

### 🛡️ **Arquitectura de Seguridad Meta-Validada**
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
- **Email**: contacto@rafacuello.online
