# Changelog - Bot de WhatsApp Joyería Rimer

## [2.3.0] - 2024-09-24

### 🚀 Nuevas Características
- **Función `processTextMessage`**: Nueva función exportada para procesamiento de mensajes en tests
- **Test Master de Integración**: Test completo que verifica detección de intención y envío de Flow
- **Scripts de Despliegue Automatizado**: Scripts para Windows (.bat) y Linux (.sh) con verificaciones automáticas
- **Documentación Completa de Tests**: README detallado en `tests/flow/` con guías de uso

### ✨ Mejoras
- **Bot Optimizado**: Función `sendAppointmentFlow` mejorada con estructura de datos simplificada
- **Servicios Reducidos**: Optimizado a 4 servicios principales para mejor rendimiento
  - 💎 Tasación de Joyas
  - 🔧 Reparación de Joyas
  - ✨ Diseño Personalizado
  - 🛍️ Asesoría de Compra Presencial
- **Estructura de Datos Simplificada**: Todos los campos habilitados por defecto para evitar errores de interacción
- **Tests Organizados**: Todos los tests de Flow movidos a carpeta `tests/flow/` para mejor organización

### 🔧 Correcciones
- **Exports del Bot**: Agregadas funciones `generateAvailableDates` y `processTextMessage` a las exportaciones
- **Configuración de Campos**: Todos los campos de dropdown configurados como `enabled: true` por defecto
- **Estructura de Fechas**: Optimizada generación de fechas disponibles con mejor formato

### 📁 Nuevos Archivos
- `tests/flow/test-master-integration.js` - Test completo de integración
- `tests/flow/test-quick-verification.js` - Test rápido sin envío de mensajes
- `tests/flow/README.md` - Documentación completa de tests
- `docker-compose.v2.3.0.yml` - Configuración Docker para nueva versión
- `deploy-v2.3.0.bat` - Script de despliegue para Windows
- `deploy-v2.3.0.sh` - Script de despliegue para Linux/Mac

### 📊 Reorganización
- **Tests Movidos**: 7 archivos de test relocalizados a `tests/flow/`:
  - `test-appointment-flow.js`
  - `test-flow-simple.js`
  - `test-flow-with-data.js`
  - `test-flow-progressive.js`
  - `test-flow-simplified.js`
  - `test-endpoint.js`
  - `test-complete-flow-fixed.js`

### 🛠️ Cambios Técnicos
- **Docker Image**: Actualizada a `racuello/joyeria-rimer-bot:2.3.0`
- **Función `sendAppointmentFlow`**: Estructura de datos optimizada para mejor interacción con WhatsApp Flow
- **Test Suite**: Suite completa de tests con verificación automática antes del despliegue

### 📋 Notas de Migración
- Usar `docker-compose.v2.3.0.yml` para nuevos despliegues
- Ejecutar `test-quick-verification.js` antes de cualquier despliegue
- Los tests antiguos en la raíz han sido movidos a `tests/flow/`

### ⚡ Rendimiento
- **Servicios Optimizados**: Reducidos de múltiples opciones a 4 servicios principales
- **Carga de Datos Mejorada**: Estructura simplificada reduce tiempo de carga del Flow
- **Menos Errores de UI**: Configuración por defecto evita errores de campos deshabilitados

---

## [2.2.1] - 2024-09-23

### 🔧 Correcciones
- **Flow Data Exchange**: Corregido manejo de eventos `data_exchange` en endpoint
- **Estructura de Datos**: Mejorada estructura del payload del Flow para evitar errores de selección
- **Endpoint de Citas**: Optimizado `/webhook/appointment-flow` para mejor respuesta

### ✨ Mejoras
- **Tests de Flow**: Múltiples tests agregados para validar funcionalidad
- **Manejo de Errores**: Mejor gestión de errores en data_exchange events

---

## [2.2.0] - 2024-09-22

### 🚀 Nuevas Características
- **WhatsApp Flows**: Sistema completo de agendamiento de citas mediante Flows interactivos
- **Cifrado RSA**: Implementación completa de cifrado/descifrado para Flows
- **Detección de Intención de Citas**: Bot detecta automáticamente cuando el usuario quiere agendar cita
- **Data Exchange Events**: Manejo completo de eventos de intercambio de datos del Flow

### ✨ Mejoras
- **AI Service**: Mejorada detección de intenciones para incluir agendamiento
- **Appointment Service**: Servicio completo para manejo de citas
- **Database Models**: Nuevos modelos para citas y manejo de datos

### 📁 Nuevos Archivos
- `core/encryption.js` - Manejo de cifrado RSA para Flows
- `services/flowService.js` - Servicio para manejo de Flows
- `services/appointmentService.js` - Servicio para agendamiento de citas
- `flow-config.json` - Configuración del Flow de WhatsApp
- `models/Appointment.js` - Modelo de base de datos para citas

---

## [2.1.0] - 2024-09-20

### 🚀 Nuevas Características
- **Catálogo Interactivo**: Listas de productos interactivas en WhatsApp
- **Base de Datos de Productos**: Sistema completo de gestión de inventario
- **Mensajería Rica**: Soporte para botones, listas y plantillas

### ✨ Mejoras
- **AI Responses**: Respuestas más naturales y contextuales
- **Memory System**: Mejor manejo de historial de conversaciones
- **Error Handling**: Manejo robusto de errores y recuperación

---

## [2.0.0] - 2024-09-15

### 🚀 Lanzamiento Inicial
- **Bot Conversacional**: Sistema base de chat con IA
- **WhatsApp Integration**: Integración completa con WhatsApp Business API
- **MongoDB Database**: Base de datos para usuarios y mensajes
- **Docker Support**: Containerización completa
- **Production Ready**: Configuración para producción con Traefik