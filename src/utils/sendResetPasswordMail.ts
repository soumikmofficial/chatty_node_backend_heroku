import { emailTemplate } from "./emailTemplate";
import sendMail from "./sendMail";

interface IResetParams {
  name: string;
  email: string;
  passwordResetToken: string;
}

const sendResetPasswordMail: Function = async ({
  name,
  email,
  passwordResetToken,
}: IResetParams) => {
  const origin = process.env.ORIGIN;
  const subject = `Reset Password`;
  const link = `${origin}/reset-password?token=${passwordResetToken}&email=${email}`;
  const body = "To reset your password click the following button.";
  const html = emailTemplate({
    from: "Chatty App",
    to: name,
    url: link,
    body,
    btnText: "Reset Password",
    preHeader: "You made a password reset request",
  });
  await sendMail({ to: email, subject, html });
};

export default sendResetPasswordMail;
