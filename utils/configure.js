// Mongoose connection setup. This file is responsible for connecting to the MongoDB database using Mongoose. 
// It exports an asynchronous function that attempts to connect to the database using the connection string 
// from environment variables. If the connection is successful, it logs a success message; if it fails, it 
// catches the error and logs it. This function can be imported and called in the main server file to establish 
// the database connection before starting the server.

const mongoose = require('mongoose');

module.exports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongoose Connected!");
    } catch (err) {
        console.log("MONGO ERROR: ", err);
    }
}