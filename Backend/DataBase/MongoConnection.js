const mongoose = require('mongoose')

const MongoConnection =  async() => {
    try{
        console.log('🟡 Tentative de connexion à MongoDB...');
        console.log('🔗 URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:[^:]*@/, ':****@') : 'NON DÉFINIE');
        
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
            connectTimeoutMS: 10000,
        })
        
        console.log('🟢 DATABASE CONNECTED SUCCESSFULLY');
    }
    catch(error){
        console.error('🔴🔴🔴 DATABASE ERROR:', error.message);
        console.error('🔴 STACK:', error.stack);
        console.error('🔴 NAME:', error.name);
        console.error('🔴 CODE:', error.code);
        // Ne pas exit, laisse le serveur démarrer quand même pour voir les logs
    }
}

module.exports = MongoConnection;
