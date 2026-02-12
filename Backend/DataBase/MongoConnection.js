const mongoose = require('mongoose')

const MongoConnection =  async() => {
    try{
        console.log('🟡 Tentative de connexion à MongoDB...');
        console.log('🔗 URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:[^:]*@/, ':****@') : 'NON DÉFINIE');
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        })
        
        console.log('🟢 DATABASE CONNECTED SUCCESSFULLY ✅');
        return true;
    }
    catch(error){
        console.error('🔴🔴🔴 DATABASE ERROR:', error.message);
        console.error('🔴 STACK:', error.stack);
        console.error('🔴 NAME:', error.name);
        console.error('🔴 CODE:', error.code);
        throw error; // ← IMPORTANT: Relance l'erreur pour que server.js la capture !
    }
}

module.exports = MongoConnection;
