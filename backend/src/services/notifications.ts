import nodemailer from 'nodemailer';
import twilio from 'twilio';
import axios from 'axios';

export async function sendEmail(settings: any, subject: string, text: string) {
  if (!settings.emailHost || !settings.emailUser) return;

  const transporter = nodemailer.createTransport({
    host: settings.emailHost,
    port: settings.emailPort || 587,
    secure: settings.emailPort === 465,
    auth: {
      user: settings.emailUser,
      pass: settings.emailPass,
    },
  });

  await transporter.sendMail({
    from: settings.emailFrom,
    to: settings.emailTo,
    subject,
    text,
  });
}

export async function sendWhatsApp(settings: any, body: string) {
  if (!settings.twilioSid || !settings.twilioToken) return;

  const client = twilio(settings.twilioSid, settings.twilioToken);
  await client.messages.create({
    body,
    from: `whatsapp:${settings.twilioFrom}`,
    to: `whatsapp:${settings.twilioTo}`,
  });
}

export async function sendTeams(settings: any, text: string) {
  if (!settings.teamsWebhook) return;

  await axios.post(settings.teamsWebhook, {
    text
  });
}

export async function notifyAll(settings: any, subject: string, body: string) {
  const promises = [];
  if (settings.emailTo) promises.push(sendEmail(settings, subject, body).catch(e => console.error('Email failed', e)));
  if (settings.twilioTo) promises.push(sendWhatsApp(settings, body).catch(e => console.error('WhatsApp failed', e)));
  if (settings.teamsWebhook) promises.push(sendTeams(settings, body).catch(e => console.error('Teams failed', e)));
  await Promise.all(promises);
}
