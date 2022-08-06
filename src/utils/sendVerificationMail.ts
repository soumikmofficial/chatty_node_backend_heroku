import { emailTemplate } from "./emailTemplate";
import sendMail from "./sendMail";

interface IEmailParams {
  name: string;
  email: string;
  verificationToken: string;
}

const sendVerificationMail: Function = async ({
  name,
  email,
  verificationToken,
}: IEmailParams) => {
  const origin = process.env.ORIGIN;
  const subject = `Verification Email`;
  const link = `${origin}/verify-email?token=${verificationToken}&email=${email}`;
  const body =
    "To use all the features of Chatty! you must verify your email account first";
  const html = emailTemplate({
    from: "Chatty App",
    to: name,
    url: link,
    body,
    btnText: "Verify Email",
    preHeader: "Verify your Chatty account",
  });
  await sendMail({ to: email, subject, html });
};

export default sendVerificationMail;
