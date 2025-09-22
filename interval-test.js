// interval-test.js

require('dotenv').config();
const axios = require('axios');

// --- CONFIGURACIÓN ---
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TO_PHONE_NUMBER = process.env.TO_PHONE_NUMBER; // Leemos el número desde el archivo .env

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !TO_PHONE_NUMBER) {
    console.error("Error: Asegúrate de que WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID y TO_PHONE_NUMBER estén en tu archivo .env");
    process.exit(1);
}

// --- FUNCIONES DE ENVÍO ---

/**
 * Función base para enviar cualquier tipo de mensaje a la API Graph.
 * @param {object} data - El payload del mensaje a enviar.
 */
async function sendMessageAPI(data) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: data
        });
        console.log(`✅ Mensaje de tipo '${data.type}' enviado a ${data.to}`);
    } catch (error) {
        console.error(`❌ Error al enviar mensaje de tipo '${data.type}':`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

/**
 * Envía un mensaje de texto simple.
 */
async function sendTextMessage(to, text) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
    };
    await sendMessageAPI(data);
}

/**
 * Envía un mensaje con una imagen desde una URL.
 */
async function sendImageMessage(to, imageUrl, caption) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
            link: imageUrl,
            caption: caption
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía un mensaje con categorías principales de joyería.
 */
async function sendCategoriesMessage(to) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: '💎 ¡Bienvenido a Joyería Rimer! ¿Qué tipo de joya te interesa?\n\nElige una categoría para ver nuestros productos más populares:'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'cat_anillos',
                            title: '💍 Anillos'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'cat_cadenas',
                            title: '🔗 Cadenas & Collares'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'cat_aretes',
                            title: '💎 Aretes'
                        }
                    }
                ]
            }
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía productos populares de Anillos.
 */
async function sendAnillosProducts(to) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: '💍 ANILLOS MÁS POPULARES\n\nDescubre nuestras piezas más solicitadas:\n\n✨ Anillo Solitario Clásico - desde $2,500\n✨ Anillo de Compromiso Halo - desde $3,200\n✨ Anillo Eternidad - desde $1,800\n\n¿Cuál te interesa?'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_solitario',
                            title: 'Ver Solitario'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_halo',
                            title: 'Ver Halo'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_eternidad',
                            title: 'Ver Eternidad'
                        }
                    }
                ]
            }
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía productos populares de Cadenas y Collares.
 */
async function sendCadenasProducts(to) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: '🔗 CADENAS & COLLARES MÁS POPULARES\n\nNuestras piezas más elegantes:\n\n✨ Cadena Tenis Diamante - desde $4,500\n✨ Collar Corazón Oro 18k - desde $1,200\n✨ Cadena Clásica Oro - desde $800\n\n¿Cuál prefieres?'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_tenis',
                            title: 'Ver Tenis'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_corazon',
                            title: 'Ver Corazón'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_clasica',
                            title: 'Ver Clásica'
                        }
                    }
                ]
            }
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía productos populares de Aretes.
 */
async function sendAretesProducts(to) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: '💎 ARETES MÁS POPULARES\n\nLos favoritos de nuestras clientas:\n\n✨ Aretes Botón Diamante - desde $1,500\n✨ Aretes Colgantes Perla - desde $900\n✨ Aretes Aro Oro 18k - desde $650\n\n¿Cuál te gusta más?'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_boton',
                            title: 'Ver Botón'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_colgante',
                            title: 'Ver Colgante'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'prod_aro',
                            title: 'Ver Aro'
                        }
                    }
                ]
            }
        }
    };
    await sendImageMessage(to, "https://i.imgur.com/example-aretes.jpg", ""); // Imagen opcional
    await sendMessageAPI(data);
}

/**
 * Envía detalles de un producto específico con imagen.
 */
async function sendProductDetail(to, productId) {
    const products = {
        'prod_solitario': {
            name: 'Anillo Solitario Clásico',
            price: '$2,500 - $8,500',
            description: '💍 ANILLO SOLITARIO CLÁSICO\n\n✨ Diamante central desde 0.5ct\n🔶 Oro blanco, amarillo o rosé 14k/18k\n💎 Certificado de autenticidad incluido\n🎁 Perfecto para compromiso\n\n¿Te interesa conocer más detalles o agendar una cita para verlo?',
            image: 'https://github.com/user-attachments/assets/9c7e2e5f-4b7e-46b3-82c5-6d1b4e37a2e3'
        },
        'prod_halo': {
            name: 'Anillo de Compromiso Halo',
            price: '$3,200 - $12,000',
            description: '💍 ANILLO HALO RADIANTE\n\n✨ Diamante central rodeado de pequeños diamantes\n🔶 Oro blanco 18k (disponible en otros metales)\n💎 Efecto de mayor brillo y tamaño\n🎁 Diseño romántico y elegante\n\n¿Te gustaría ver más modelos o agendar una cita?',
            image: 'https://i.imgur.com/example-halo.jpg'
        },
        'prod_eternidad': {
            name: 'Anillo Eternidad',
            price: '$1,800 - $5,500',
            description: '💍 ANILLO ETERNIDAD\n\n✨ Diamantes alrededor de toda la banda\n🔶 Oro blanco o amarillo 14k/18k\n💎 Símbolo de amor eterno\n🎁 Ideal para aniversario o matrimonio\n\n¿Quieres ver otras opciones o necesitas más información?',
            image: 'https://i.imgur.com/example-eternidad.jpg'
        },
        'prod_tenis': {
            name: 'Cadena Tenis Diamante',
            price: '$4,500 - $15,000',
            description: '🔗 CADENA TENIS DIAMANTE\n\n✨ Diamantes de laboratorio o naturales\n🔶 Oro blanco 18k con cierre de seguridad\n💎 Brillos incomparables\n🎁 Elegancia para cualquier ocasión\n\n¿Te interesa una cotización personalizada?',
            image: 'https://i.imgur.com/example-tenis.jpg'
        },
        'prod_corazon': {
            name: 'Collar Corazón Oro 18k',
            price: '$1,200 - $3,500',
            description: '🔗 COLLAR CORAZÓN ORO 18K\n\n✨ Dije en forma de corazón\n🔶 Oro amarillo, blanco o rosé\n💎 Opción con diamantes pequeños\n🎁 Regalo perfecto para ser querida\n\n¿Quieres personalizarlo con grabado?',
            image: 'https://i.imgur.com/example-corazon.jpg'
        },
        'prod_clasica': {
            name: 'Cadena Clásica Oro',
            price: '$800 - $2,200',
            description: '🔗 CADENA CLÁSICA ORO\n\n✨ Diseño atemporal y elegante\n🔶 Oro 14k o 18k, varios largos\n💎 Perfecta para usar sola o con dije\n🎁 Básico esencial en joyería\n\n¿Prefieres verla en tienda o necesitas medidas?',
            image: 'https://i.imgur.com/example-clasica.jpg'
        }
    };

    const product = products[productId];
    if (product) {
        // Enviar imagen del producto
        await sendImageMessage(to, product.image, "");
        
        // Enviar detalles con botones de acción
        const data = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: `${product.description}\n\nPrecio: ${product.price}`
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'cotizar_producto',
                                title: '💰 Cotizar'
                            }
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'agendar_cita',
                                title: '📅 Agendar Cita'
                            }
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'ver_mas_productos',
                                title: '👀 Ver Más'
                            }
                        }
                    ]
                }
            }
        };
        await sendMessageAPI(data);
    }
}

/**
 * Función principal que demuestra el flujo completo de categorías y productos.
 */
async function runTest() {
  console.log(`🚀 Iniciando demostración de catálogo interactivo para ${TO_PHONE_NUMBER}...`);

  // 1. Enviar PLANTILLA para abrir la ventana de 24 horas.
  console.log("Enviando plantilla 'hello_world' para iniciar la conversación...");
  await sendMessageAPI({
    messaging_product: 'whatsapp',
    to: TO_PHONE_NUMBER,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' }
    }
  });

  // Esperar un poco
  console.log("\nEsperando 10 segundos...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 2. Enviar mensaje de bienvenida
  console.log("Enviando mensaje de bienvenida...");
  await sendTextMessage(TO_PHONE_NUMBER, "¡Hola! Bienvenido a la demostración del catálogo interactivo de Joyería Rimer 💎");

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Mostrar categorías principales
  console.log("Mostrando categorías principales...");
  await sendCategoriesMessage(TO_PHONE_NUMBER);

  await new Promise(resolve => setTimeout(resolve, 10000));

  // 4. Demo: Mostrar productos de Anillos
  console.log("Demostrando productos de Anillos...");
  await sendTextMessage(TO_PHONE_NUMBER, "Demo: Seleccionaste 💍 Anillos");
  await sendAnillosProducts(TO_PHONE_NUMBER);

  await new Promise(resolve => setTimeout(resolve, 8000));

  // 5. Demo: Mostrar detalle de producto específico
  console.log("Mostrando detalle del Anillo Solitario...");
  await sendTextMessage(TO_PHONE_NUMBER, "Demo: Seleccionaste 'Ver Solitario'");
  await sendProductDetail(TO_PHONE_NUMBER, 'prod_solitario');

  await new Promise(resolve => setTimeout(resolve, 10000));

  // 6. Demo: Mostrar otra categoría (Cadenas)
  console.log("Demostrando productos de Cadenas...");
  await sendTextMessage(TO_PHONE_NUMBER, "Demo: Ahora veamos 🔗 Cadenas & Collares");
  await sendCadenasProducts(TO_PHONE_NUMBER);

  await new Promise(resolve => setTimeout(resolve, 8000));

  // 7. Demo: Mostrar producto de cadenas
  console.log("Mostrando detalle de Cadena Tenis...");
  await sendTextMessage(TO_PHONE_NUMBER, "Demo: Seleccionaste 'Ver Tenis'");
  await sendProductDetail(TO_PHONE_NUMBER, 'prod_tenis');

  await new Promise(resolve => setTimeout(resolve, 10000));

  // 8. Demo: Mostrar Aretes
  console.log("Demostrando productos de Aretes...");
  await sendTextMessage(TO_PHONE_NUMBER, "Demo: Finalmente veamos 💎 Aretes");
  await sendAretesProducts(TO_PHONE_NUMBER);

  await new Promise(resolve => setTimeout(resolve, 8000));

  // 9. Mensaje final
  console.log("Enviando mensaje final...");
  await sendTextMessage(TO_PHONE_NUMBER, 
    "✨ ¡Demo completada!\n\n" +
    "Este es el flujo que tendría un cliente:\n" +
    "1️⃣ Selecciona categoría\n" +
    "2️⃣ Ve productos populares\n" +
    "3️⃣ Ve detalles específicos\n" +
    "4️⃣ Puede cotizar o agendar cita\n\n" +
    "¿Te gusta cómo se ve? 😊"
  );

  console.log("\n✅ Demostración completa del catálogo interactivo finalizada.");
}

/**
 * Función para probar solo las categorías (sin la demo completa).
 */
async function testCategoriesOnly() {
    console.log("🔧 Probando solo el sistema de categorías...");
    
    // Enviar template primero
    await sendMessageAPI({
        messaging_product: 'whatsapp',
        to: TO_PHONE_NUMBER,
        type: 'template',
        template: {
            name: 'hello_world',
            language: { code: 'en_US' }
        }
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Mostrar categorías
    await sendCategoriesMessage(TO_PHONE_NUMBER);
    
    console.log("✅ Categorías enviadas. Ahora puedes interactuar con los botones.");
}

/**
 * Función para manejar respuestas de botones (simula el webhook).
 * Llama a esta función manualmente con el ID del botón presionado.
 */
async function handleButtonResponse(buttonId) {
    console.log(`🔘 Procesando respuesta del botón: ${buttonId}`);
    
    switch(buttonId) {
        case 'cat_anillos':
            await sendAnillosProducts(TO_PHONE_NUMBER);
            break;
        case 'cat_cadenas':
            await sendCadenasProducts(TO_PHONE_NUMBER);
            break;
        case 'cat_aretes':
            await sendAretesProducts(TO_PHONE_NUMBER);
            break;
        case 'prod_solitario':
        case 'prod_halo':
        case 'prod_eternidad':
        case 'prod_tenis':
        case 'prod_corazon':
        case 'prod_clasica':
        case 'prod_boton':
        case 'prod_colgante':
        case 'prod_aro':
            await sendProductDetail(TO_PHONE_NUMBER, buttonId);
            break;
        case 'cotizar_producto':
            await sendTextMessage(TO_PHONE_NUMBER, 
                "💰 ¡Perfecto! Para enviarte una cotización personalizada necesito algunos datos:\n\n" +
                "📱 Nombre completo\n📍 Ciudad\n💍 Producto de interés\n💎 Preferencias especiales\n\n" +
                "¿Te parece si agendamos una cita para darte atención personalizada?"
            );
            break;
        case 'agendar_cita':
            await sendTextMessage(TO_PHONE_NUMBER,
                "📅 ¡Excelente! Para agendar tu cita necesito:\n\n" +
                "🗓️ Fecha preferida\n⏰ Hora conveniente\n📍 Sucursal (Centro o Norte)\n💍 Productos a ver\n\n" +
                "Responde con tu disponibilidad y coordinaremos todo 😊"
            );
            break;
        case 'ver_mas_productos':
            await sendCategoriesMessage(TO_PHONE_NUMBER);
            break;
        default:
            await sendTextMessage(TO_PHONE_NUMBER, "🤔 No reconozco esa opción. ¿Puedes elegir una de las opciones disponibles?");
    }
}

// Puedes cambiar qué función ejecutar:
// runTest();              // Demo completa automática
testCategoriesOnly();    // Solo muestra categorías para interactuar manualmente

// Para probar respuestas de botones manualmente, descomenta y cambia el ID:
// handleButtonResponse('cat_anillos');  // Ejemplo: simula clic en "Anillos"