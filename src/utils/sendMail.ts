const nodemailer = require("nodemailer");
// importing the following way causes error
// import { nodemailerConfig } from "./nodemailerConfig";
import { google } from "googleapis";

const oAuth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT
);
oAuth2Client.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });

interface IMailParams {
  to: string;
  subject: string;
  html: string;
}

const sendMail: Function = async ({ to, subject, html }: IMailParams) => {
  const accessToken = await oAuth2Client.getAccessToken();
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: process.env.OAUTH_EMAIL,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      accessToken,
    },
  });

  await transporter.sendMail({
    from: '"Chatty App " <eli.okuneva99@ethereal.email>',
    to,
    subject,
    html,
  });
};

export default sendMail;
