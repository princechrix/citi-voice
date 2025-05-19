import { Injectable } from '@nestjs/common';
import { createTransport, Transporter, SentMessageInfo } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    if (!user || !pass) {
      throw new Error('Email configuration is missing');
    }

    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  } 

  private async readTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(process.cwd(), 'src', 'mail', 'templates', templateName);
    try {
      return await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
      console.error(`Error reading template ${templateName}:`, error);
      throw new Error(`Failed to read email template: ${templateName}`);
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  } 

  async sendVerificationEmail(to: string, name: string, verificationLink: string): Promise<SentMessageInfo> {
    const template = await this.readTemplate('verification-email.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      verificationLink,
      year: `${new Date().getFullYear()}`,
    });

    return this.sendMail(
      to,
      'Verify Your Email - Citi Voice',
      html,
    );
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<SentMessageInfo> {
    const template = await this.readTemplate('reset-password.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      resetLink,
      year: `${new Date().getFullYear()}`,
    });

    return this.sendMail(
      to,
      'Reset Your Password - Citi Voice',
      html,
    );
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    username: string,
    password: string,
  ): Promise<SentMessageInfo> {
    const template = await this.readTemplate('welcome-email.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      username,
      password,
      year: `${new Date().getFullYear()}`,
    });

    return this.sendMail(
      to,
      'Welcome to Citi Voice!',
      html,
    );
  }

  async sendComplaintConfirmationEmail(
    to: string,
    name: string,
    trackingCode: string,
    agencyName: string,
    agencyLogoUrl: string | null,
    trackingLink: string,
  ): Promise<SentMessageInfo> {
    const template = await this.readTemplate('complaint-confirmation.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      trackingCode,
      agencyName,
      agencyLogoUrl: agencyLogoUrl ?? 'https://i.imgur.com/aQda867.png',
      trackingLink,
      year: `${new Date().getFullYear()}`,
    });

    return this.sendMail(
      to,
      'Complaint Received - Citi Voice',
      html,
    );
  }

  async sendComplaintAssignmentEmail(
    to: string,
    name: string,
    subject: string,
    agencyName: string,
    trackingCode: string,
  ): Promise<SentMessageInfo> {
    const template = await this.readTemplate('complaint-assignment.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      trackingCode,
      subject,
      agencyName,
      year: `${new Date().getFullYear()}`,
    });

    return this.sendMail(
      to,
      'New Complaint Assignment - Citi Voice',
      html,
    );
  }

  async sendComplaintStatusUpdateEmail(
    to: string,
    name: string,
    subject: string,
    agencyName: string,
    trackingCode: string,
    agencyLogoUrl: string,
    status: string,
  ): Promise<SentMessageInfo> {
    const template = await this.readTemplate('complaint-status-update.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      trackingCode,
      subject,
      agencyName,
      status,
      agencyLogoUrl: agencyLogoUrl,
      trackingLink: `https://citi-voice-frontend-nu.vercel.app/track/${trackingCode}`,
      year: `${new Date().getFullYear()}`,
    });

    return this.sendMail(
      to,
      'Complaint Status Update - Citi Voice',
      html,
    );
  }

  async sendComplaintTransferEmail(
    to: string,
    name: string,
    subject: string,
    targetAgencyName: string,
    targetAgencyLogoUrl: string | null,
    trackingCode: string,
    transferReason?: string,
  ): Promise<SentMessageInfo> {
    const template = await this.readTemplate('complaint-transfer.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      subject,
      targetAgencyName,
      targetAgencyLogoUrl: targetAgencyLogoUrl || 'https://i.imgur.com/aQda867.png',
      trackingCode,
      transferReason: transferReason || '',
      trackingLink: `https://citi-voice-frontend-nu.vercel.app/track/${trackingCode}`,
      year: `${new Date().getFullYear()}`,
    });

    return this.sendMail(
      to,
      'Complaint Transfer Notification - Citi Voice',
      html,
    );
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<SentMessageInfo> {
    if (!this.transporter) {
      throw new Error('Mail transporter is not initialized');
    }

    try {
      return await this.transporter.sendMail({
        from: `"Citi Voice" <${this.configService.get<string>('EMAIL_USER')}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error('Mail send failed:', err);
      throw err;
    }
  }
}
