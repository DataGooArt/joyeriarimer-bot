const axios = require('axios');

class WhatsAppService {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN;
        this.baseURL = 'https://graph.facebook.com/v21.0';
    }

    isConfigured() {
        return !!(this.accessToken && this.phoneNumberId && this.verifyToken);
    }

    async sendMessage(to, message) {
        if (!this.isConfigured()) {
            throw new Error('WhatsApp Service no está configurado');
        }

        try {
            const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
            const response = await axios.post(url, {
                messaging_product: 'whatsapp',
                to: to,
                ...message
            }, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error enviando mensaje WhatsApp:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendFlow(to, flowId, flowActionPayload) {
        const message = {
            type: 'interactive',
            interactive: {
                type: 'flow',
                body: {
                    text: '¡Perfecto! Te ayudo a agendar tu cita. Por favor completa la información:'
                },
                action: {
                    name: 'flow',
                    parameters: {
                        flow_id: flowId,
                        flow_cta: 'Agendar Cita',
                        flow_action: 'navigate',
                        flow_action_payload: flowActionPayload
                    }
                }
            }
        };

        return await this.sendMessage(to, message);
    }

    async sendTextMessage(to, text) {
        const message = {
            type: 'text',
            text: { body: text }
        };

        return await this.sendMessage(to, message);
    }

    async sendTemplateMessage(to, templateName, languageCode = 'es', components = []) {
        const message = {
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                components: components
            }
        };

        return await this.sendMessage(to, message);
    }
}

const whatsappService = new WhatsAppService();

module.exports = { whatsappService };
