const mongoose = require('mongoose')

const MongoConnection =  async() => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log('database connected')
    }
    catch(error){
        console.error('DATABASE ERROR:', error.message)
        console.error('Stack:', error.stack)
    }
}

module.exports = MongoConnection
