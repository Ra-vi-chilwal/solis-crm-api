const mongoose = require("mongoose")
require("dotenv").config()
module.exports = async function connectToDatabase() {
  try {
    await mongoose.connect(`mongodb://localhost:27017/dev`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4,
    })
    console.log(`Connected to database: ${mongoose.connection.name}`)
  } catch (error) {
    console.error("Error connecting to the database:", error)
  }
}