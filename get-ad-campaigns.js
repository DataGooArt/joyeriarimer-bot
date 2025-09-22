'use strict';

require('dotenv').config();
const bizSdk = require('facebook-nodejs-business-sdk');

// --- CONFIGURACIÓN ---
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;

if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error("Error: Asegúrate de definir FB_ACCESS_TOKEN y FB_AD_ACCOUNT_ID en tu archivo .env");
    process.exit(1);
}

// --- INICIALIZACIÓN DE LA API ---
const AdAccount = bizSdk.AdAccount;
const api = bizSdk.FacebookAdsApi.init(FB_ACCESS_TOKEN);
// api.setDebug(true); // Descomenta esta línea si necesitas ver logs detallados

/**
 * Función para obtener y listar las campañas de una cuenta publicitaria.
 */
async function getCampaigns() {
    try {
        console.log(`Obteniendo campañas de la cuenta de anuncios: ${FB_AD_ACCOUNT_ID}`);

        const adAccount = new AdAccount(FB_AD_ACCOUNT_ID);
        
        // Definimos los campos que queremos obtener de cada campaña
        const fields = ['name', 'objective', 'status', 'effective_status'];

        const campaigns = await adAccount.getCampaigns(fields);

        console.log('✅ ¡Campañas obtenidas exitosamente!');
        
        if (campaigns.length > 0) {
            console.log('--- Listado de Campañas ---');
            campaigns.forEach(campaign => {
                console.log(`- ID: ${campaign.id} | Nombre: ${campaign.name} | Estado: ${campaign.effective_status}`);
            });
        } else {
            console.log('No se encontraron campañas en esta cuenta.');
        }
    } catch (error) {
        console.error('❌ Error al obtener las campañas:', error.response ? JSON.stringify(error.response.data, null, 2) : error);
        process.exit(1);
    }
}

getCampaigns();