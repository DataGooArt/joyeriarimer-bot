'use strict';

require('dotenv').config();
const bizSdk = require('facebook-nodejs-business-sdk');

// --- CONFIGURACIÓN ---
// Leemos las credenciales desde el archivo .env
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;

// Verifica que las credenciales necesarias estén presentes
if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error("Error: Asegúrate de definir FB_ACCESS_TOKEN y FB_AD_ACCOUNT_ID en tu archivo .env");
    process.exit(1);
}

// --- INICIALIZACIÓN DE LA API ---
const AdAccount = bizSdk.AdAccount;
const Campaign = bizSdk.Campaign;
const api = bizSdk.FacebookAdsApi.init(FB_ACCESS_TOKEN);
api.setDebug(true); // Muestra logs detallados de la API

/**
 * Función principal para crear una campaña de prueba.
 */
async function createTestCampaign() {
    try {
        console.log(`Usando la cuenta de anuncios: ${FB_AD_ACCOUNT_ID}`);

        const campaignName = `Campaña de Prueba para Joyería Rimer - ${new Date().toISOString()}`;
        console.log(`Creando campaña con nombre: "${campaignName}"`);

        const fields = [];
        const params = {
            'name': campaignName,
            'objective': 'OUTCOME_TRAFFIC', // Objetivo de la campaña: Tráfico
            'status': 'PAUSED', // La creamos en pausa para no gastar dinero
            'special_ad_categories': [],
        };

        const adAccount = new AdAccount(FB_AD_ACCOUNT_ID);
        const campaign = await adAccount.createCampaign(fields, params);

        console.log('✅ ¡Campaña creada exitosamente!');
        console.log(`ID de la Campaña: ${campaign.id}`);

    } catch (error) {
        console.error('❌ Error al crear la campaña:');
        console.error(error.response ? JSON.stringify(error.response.data, null, 2) : error);
        process.exit(1);
    }
}

createTestCampaign();