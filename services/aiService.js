const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.initializeAI();
    }

    initializeAI() {
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        } else {
            console.warn('⚠️ Google AI API Key no configurada. Usando detección de intención básica.');
        }
    }

    async detectIntent(message) {
        if (!message || typeof message !== 'string') {
            return 'general';
        }

        const messageLower = message.toLowerCase().trim();

        // Palabras clave para saludos
        const greetingKeywords = [
            'hola', 'hello', 'hi', 'buenos días', 'buenas tardes', 'buenas noches',
            'buen día', 'buena tarde', 'buena noche', 'saludos', 'hey'
        ];

        // Palabras clave para citas
        const appointmentKeywords = [
            'cita', 'citas', 'agendar', 'agenda', 'reservar', 'reserva',
            'appointment', 'schedule', 'book', 'booking',
            'cuando', 'disponible', 'horario', 'hora', 'día', 'fecha',
            'quiero', 'necesito', 'me gustaría', 'quisiera'
        ];

        // Palabras clave para productos
        const productKeywords = [
            'anillo', 'anillos', 'collar', 'collares', 'pulsera', 'pulseras',
            'aretes', 'pendientes', 'cadena', 'cadenas', 'joya', 'joyas',
            'oro', 'plata', 'diamante', 'diamantes', 'precio', 'precios',
            'catálogo', 'productos', 'mostrar', 'enseñar', 'ver'
        ];

        // Palabras clave para información
        const infoKeywords = [
            'información', 'info', 'ubicación', 'dirección', 'teléfono',
            'horarios', 'contacto', 'dónde', 'cómo', 'qué', 'ayuda',
            'servicio', 'servicios', 'reparación', 'reparaciones'
        ];

        // Detectar intención basada en palabras clave
        // Priorizar saludos simples
        if (greetingKeywords.some(keyword => messageLower === keyword || messageLower.startsWith(keyword + ' ') || messageLower.endsWith(' ' + keyword))) {
            return 'greeting';
        }

        if (appointmentKeywords.some(keyword => messageLower.includes(keyword))) {
            return 'schedule_appointment';
        }

        if (productKeywords.some(keyword => messageLower.includes(keyword))) {
            return 'product_inquiry';
        }

        if (infoKeywords.some(keyword => messageLower.includes(keyword))) {
            return 'information';
        }

        // Si tenemos AI disponible, usar análisis avanzado
        if (this.model) {
            try {
                return await this.detectIntentWithAI(message);
            } catch (error) {
                console.warn('⚠️ Error en AI, usando detección básica:', error.message);
            }
        }

        return 'general';
    }

    async detectIntentWithAI(message) {
        if (!this.model) {
            return this.detectIntent(message); // Fallback to basic detection
        }

        try {
            const prompt = `
Analiza el siguiente mensaje de un cliente de joyería y determina la intención principal.
Responde SOLO con una de estas opciones:
- greeting: Si es un saludo simple como "hola", "buenos días", etc.
- schedule_appointment: Si quiere agendar cita, consulta, reunión o hablar en persona
- product_inquiry: Si pregunta por productos, joyas, precios, catálogo
- information: Si pide información general, ubicación, horarios, contacto
- general: Para cualquier otro caso

Mensaje del cliente: "${message}"

Intención:`;

            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim().toLowerCase();

            // Validar respuesta
            const validIntents = ['greeting', 'schedule_appointment', 'product_inquiry', 'information', 'general'];
            if (validIntents.includes(response)) {
                return response;
            }

            return 'general';
        } catch (error) {
            console.warn('⚠️ Error en AI detectIntent:', error.message);
            return 'general';
        }
    }

    async generateResponse(intent, context = {}) {
        const responses = {
            appointment: [
                '¡Perfecto! Te ayudo a agendar tu cita. ¿Qué día te viene mejor?',
                'Excelente, vamos a agendar tu cita. ¿Tienes alguna preferencia de horario?',
                '¡Claro! Te ayudo con tu cita. ¿Para qué tipo de consulta sería?'
            ],
            product_inquiry: [
                '¡Me encanta ayudarte con nuestras joyas! ¿Buscas algo en particular?',
                'Tenemos hermosas piezas disponibles. ¿Qué tipo de joya te interesa?',
                '¡Perfecto! ¿Te interesa ver nuestro catálogo o buscas algo específico?'
            ],
            information: [
                '¡Por supuesto! Estoy aquí para ayudarte con cualquier información que necesites.',
                'Con gusto te ayudo. ¿Qué información específica necesitas?',
                '¡Claro! ¿En qué te puedo ayudar?'
            ],
            general: [
                '¡Hola! Soy el asistente de la joyería. ¿En qué puedo ayudarte hoy?',
                '¡Bienvenido! ¿Te interesa agendar una cita, ver productos o necesitas información?',
                '¡Hola! Estoy aquí para ayudarte con citas, productos o cualquier consulta.'
            ]
        };

        const intentResponses = responses[intent] || responses.general;
        const randomResponse = intentResponses[Math.floor(Math.random() * intentResponses.length)];

        return randomResponse;
    }

    isConfigured() {
        return !!this.model;
    }

    getStatus() {
        return {
            configured: this.isConfigured(),
            model: this.model ? 'gemini-pro' : 'basic-keywords',
            hasApiKey: !!process.env.GOOGLE_AI_API_KEY || !!process.env.GEMINI_API_KEY
        };
    }
}

const aiService = new AIService();

module.exports = { aiService };
