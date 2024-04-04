const {
  errorResponse,
  createResponse,
  fetchResponse,
} = require("../utils/services")
const { Notes } = require("./model")
const moment = require("moment")
const createNotes = async (req, res) => {
  try {
    // Get the current time in "12.30 AM/PM" format
    const currentTime = moment().format("hh:mm A")
    // Get the current date in "MM-DD-YYYY" format
    const currentDate = moment().format("DD-MM-YYYY")
    const notesAdded = await Notes.create({
      user: req.user._id,
      company: req.user.company._id,
      notes: req.body.notes,
      date: currentDate,
      time: currentTime,
    })
    return createResponse(res, "Notes added!", notesAdded)
  } catch (error) {
    console.log(error)
    return errorResponse(res, "Something went wrong while creating notes", "")
  }
}

const deleteNotes = async (req, res) => {
  try {
    const noteId = req.params.noteId
    const deletedNote = await Notes.findByIdAndRemove(noteId)

    if (!deletedNote) {
      return errorResponse(res, "Note not found", "")
    }

    return fetchResponse(res, "Note deleted successfully", deletedNote)
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while deleting the note",
      ""
    )
  }
}

const updateNotes = async (req, res) => {
  try {
    const noteId = req.params.noteId
    // Get the current time in "12.30 AM/PM" format
    const currentTime = moment().format("hh:mm A")
    // Get the current date in "MM-DD-YYYY" format
    const currentDate = moment().format("DD-MM-YYYY")
    const updatedNote = await Notes.findByIdAndUpdate(
      noteId,
      {
        notes: req.body.notes,
        updateDate: currentDate,
        updateTime: currentTime,
      },
      { new: true }
    )

    if (!updatedNote) {
      return errorResponse(res, "Note not found", "")
    }

    return fetchResponse(res, "Note updated successfully", updatedNote)
  } catch (error) {
    console.log(error)
    return errorResponse(
      res,
      "Something went wrong while updating the note",
      ""
    )
  }
}
const fetchNotes = async (req, res) => {
  try {
    // const userId = req.params.userId;
    // Replace 'Notes' with your actual model name and field for userId
    const notes = await Notes.find({ user: req.user._id })

    return fetchResponse(res, "Notes fetched successfully", notes)
  } catch (error) {
    console.log(error)
    return errorResponse(res, "Something went wrong while fetching notes", "")
  }
}

module.exports = {
  createNotes,
  deleteNotes,
  updateNotes,
  fetchNotes,
}
