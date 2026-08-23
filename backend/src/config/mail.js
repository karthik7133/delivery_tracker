import nodemailer from "nodemailer";

let transporter = null;

export function getMailer() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: (Number(process.env.EMAIL_PORT) || 587) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
}

export const EMAIL_FROM = process.env.EMAIL_FROM || "Delivery Tracker <noreply@deliverytracker.com>";
