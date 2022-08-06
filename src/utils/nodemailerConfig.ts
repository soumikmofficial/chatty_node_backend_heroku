import { google } from "googleapis";

const oAuth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT
);
oAuth2Client.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });

export const nodemailerConfig = {
  service: "gamil",
  auth: {
    type: "Oauth2",
    user: "soumikm.official@gmail.com",
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken,
    accessToken,
  },
};
// export const nodemailerConfig = {
//   host: process.env.Ethereal_SMTP_SERVER,
//   port: Number(process.env.Ethereal_PORT),
//   auth: {
//     user: process.env.Ethereal_LOGIN,
//     pass: process.env.OAUTH_CLIENT_IDEthereal_PASSOAUTH_CLIENT_IDOAUTH_CLIENT_IDWORD,
//   },
// };
