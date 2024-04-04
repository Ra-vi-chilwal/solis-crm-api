module.exports = {
  fetchResponse: (res, message, data) => {
    return res.status(200).json({ success: true, message, data })
  },
  notFoundResponse: (res, message, data) => {
    return res.status(200).json({ success: false, message, data })
  },
  duplicateResponse: (res, message, data) => {
    return res.status(409).json({ success: true, message, data })
  },
  createResponse: (res, message, data) => {
    return res.status(201).json({ success: true, message, data })
  },
  errorResponse: (res, message, data) => {
    return res.status(500).json({ success: false, message, data })
  },
  unauthorizedResponse: (res, message, data) => {
    return res.status(401).json({ success: false, message, data })
  },
}
