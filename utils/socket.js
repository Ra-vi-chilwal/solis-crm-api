const { Users } = require("../Auth/model")

// socketModule.js (Separate Socket.IO Module)
module.exports = async (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected")

    // Handle user disconnection and status change
    socket.on("disconnect", () => {
      console.log("User disconnected")
      // Update the user's status to "offline" in your database
      // ...
    })

    socket.on("userStatusChange", async (data) => {
      // Handle user status change event
      await Users.findByIdAndUpdate(req)
    })
  })
}
