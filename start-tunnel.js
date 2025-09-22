// Ejemplo de cómo se usaría el paquete de npm
require('dotenv').config(); // Carga las variables de entorno desde .env
const ngrok = require('@ngrok/ngrok');

(async function() {
  const listener = await ngrok.forward({
    addr: 1337,
    authtoken_from_env: true,
    root_cas: "host" // Intenta usar el almacén de certificados del sistema operativo
  });
  console.log(`Túnel iniciado en: ${listener.url()}`);
  console.log('El túnel está activo. Presiona Ctrl+C para cerrarlo.');

  // Manejo de cierre elegante para detener el túnel al presionar Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\nCerrando el túnel de ngrok...');
    await listener.close();
    console.log('Túnel cerrado.');
    process.exit(0);
  });

  // Mantiene el proceso vivo indefinidamente hasta que se presione Ctrl+C
  await new Promise(() => {});
})();
