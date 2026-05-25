import nodemailer from 'nodemailer';
import twilio from 'twilio';
import axios from 'axios';
import sgMail from '@sendgrid/mail';

export async function sendEmail(settings: any, subject: string, text: string): Promise<void> {
  if (!settings.emailHost || !settings.emailUser || !settings.emailTo) return;
  const transporter = nodemailer.createTransport({
    host: settings.emailHost,
    port: Number(settings.emailPort) || 587,
    secure: Number(settings.emailPort) === 465,
    auth: { user: settings.emailUser, pass: settings.emailPass },
  });
  await transporter.sendMail({ from: settings.emailFrom, to: settings.emailTo, subject, text });
}

export async function sendSendGrid(settings: any, subject: string, text: string): Promise<void> {
  if (!settings.sendgridApiKey || !settings.sendgridFrom || !settings.sendgridTo) return;
  sgMail.setApiKey(settings.sendgridApiKey);
  await sgMail.send({ to: settings.sendgridTo, from: settings.sendgridFrom, subject, text });
}

export async function sendWhatsApp(settings: any, body: string): Promise<void> {
  if (!settings.twilioSid || !settings.twilioToken || !settings.twilioTo) return;
  const client = twilio(settings.twilioSid, settings.twilioToken);
  await client.messages.create({
    body,
    from: `whatsapp:${settings.twilioFrom}`,
    to: `whatsapp:${settings.twilioTo}`,
  });
}

export async function sendTeams(settings: any, text: string): Promise<void> {
  if (!settings.teamsWebhook) return;
  await axios.post(settings.teamsWebhook, { text });
}

export async function notifyAll(settings: any, subject: string, body: string): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (settings.sendgridTo && settings.sendgridApiKey)
    tasks.push(sendSendGrid(settings, subject, body).catch(e => console.error('SendGrid failed', e)));
  if (settings.emailTo && settings.emailHost)
    tasks.push(sendEmail(settings, subject, body).catch(e => console.error('Email failed', e)));
  if (settings.twilioTo && settings.twilioSid)
    tasks.push(sendWhatsApp(settings, body).catch(e => console.error('WhatsApp failed', e)));
  if (settings.teamsWebhook)
    tasks.push(sendTeams(settings, body).catch(e => console.error('Teams failed', e)));
  await Promise.all(tasks);
}
