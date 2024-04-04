const nodemailer = require("nodemailer")

const sendEmail = (receiverEmail, subject, emailData) => {
  const mailOptions = {
    from: "your-email@gmail.com", // Sender email address
    to: receiverEmail, // Receiver email address
    subject: subject, // Email subject
    text: emailData, // Email text (you can use HTML for a formatted email)
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error)
    } else {
      console.log("Email sent:", info.response)
    }
  })
}

// Create a Nodemailer transporter using SMTP or other email service configurations
const transporter = nodemailer.createTransport({
  service: "Gmail", // Replace with your email service provider
  auth: {
    user: "ayush.sharma@solistechnology.in", // Your email address
    pass: "your-password", // Your email password or an application-specific password
  },
})

module.exports = {
  sendEmail,
}
