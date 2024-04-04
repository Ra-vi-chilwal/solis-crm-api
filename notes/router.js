const { checkToken } = require("../middleware")
const {
  createNotes,
  fetchNotes,
  updateNotes,
  deleteNotes,
} = require("./controller")

const router = require("express").Router()

// Create a new note
router.post("/create", checkToken, createNotes)

// Delete a note by ID
router.delete("/:noteId", checkToken, deleteNotes)

// Update a note by ID
router.put("/:noteId", checkToken, updateNotes)

// Fetch notes by userId
router.get("/fetch", checkToken, fetchNotes)
module.exports = router
