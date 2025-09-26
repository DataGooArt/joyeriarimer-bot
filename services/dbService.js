const mongoose = require('mongoose');

class DBService {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            return true;
        }

        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-joyeria';
            await mongoose.connect(mongoUri);
            this.isConnected = true;
            console.log('✅ Conectado a MongoDB');
            return true;
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('✅ Desconectado de MongoDB');
        }
    }

    getConnection() {
        return mongoose.connection;
    }

    isReady() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
}

const dbService = new DBService();

module.exports = { dbService };
