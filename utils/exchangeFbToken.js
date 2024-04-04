const axios = require('axios')
const fs = require("fs").promises
const dotenv = require("dotenv")
const path = require("path")

const exchangeToken= async () => {
    try {
      const client_id = process.env.FB_CLIENT_ID
      const client_secret = process.env.FB_CLIENT_SECRET
      const short_lived_token = process.env.FB_ACCESS_TOKEN
      // console.log(client_id, client_secret, short_lived_token);
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${client_id}&client_secret=${client_secret}&fb_exchange_token=${short_lived_token}`
      )
      const long_lived_token = response.data.access_token
      // Define the path to your .env file
      const envFilePath = path.join(__dirname, "../", ".env")
      const envData = await fs.readFile(envFilePath, "utf8")
      // Parse the .env file content
      const envConfig = dotenv.parse(envData)
      // Update the FB_ACCESS_TOKEN with the new value
      envConfig.FB_ACCESS_TOKEN = long_lived_token
      // Create a new string with the updated content
      const updatedEnvData = Object.keys(envConfig)
        .map((key) => `${key}=${envConfig[key]}`)
        .join("\n")

      // Write the updated content back to the .env file
      await fs.writeFile(envFilePath, updatedEnvData)

      // Write the updated content back to the .env file
      await fs.writeFile(envFilePath, updatedEnvData)
      console.log("Token exchanged successfully!")
    } catch (error) {
      console.log(error)
      // return errorResponse(res, "Something went wrong while exchanging the Fb token!", '')
    }
  }

  module.exports = {
    exchangeToken
  }