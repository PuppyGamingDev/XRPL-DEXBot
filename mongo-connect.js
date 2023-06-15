const mongoose = require('mongoose')
mongoose.set('strictQuery', true)

require('dotenv/config')

let cached = global.mongoConnection

const mongoConnect = async () => {
    if (cached) {
        return cached
    }

    console.log('Creating a new Mongo connection');

    let mongoConnResult = null;
    try {
        mongoConnResult = await new Promise((resolve) => {
            mongoose.connect(process.env.MONGOURI).then((mongoose) => {
                cached = mongoose
                resolve(cached)
            })
        })

        console.log('Mongo connection Created successfully.');
    }
    catch (error) {
        console.log('Mongo connection Failed:');
        console.error(error);
    }

    return mongoConnResult;
}

module.exports = mongoConnect