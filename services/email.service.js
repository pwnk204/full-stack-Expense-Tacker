import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_TRAP_HOST,
  port: process.env.MAIL_TRAP_PORT,
  auth: {
    user: process.env.MAIL_TRAP_USERNAME,
    pass: process.env.MAIL_TRAP_PASSWORD,
  },
});

const sendEmail = async (to, text, subject, htmlContent) => {
  try {
    const message = {
      from: '"Expense Tracker App" <hello@demomailtrap.co>',
      to: to,
      subject: subject,
      text: text,
      html: htmlContent,
    };

    const info = await transporter.sendMail(message);

    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
