const mongoose = require('mongoose')

const MyMongoConnection = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('Database connected successfully')
    }
    catch(error) {
        console.error('No database connection found:', error.message);
        process.exit(1)
    }
}

module.exports = MyMongoConnection         