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
    });

    return this.sendMail(
      to,
      'Reset Your Password - Citi Voice',
      html,
    );
  }

  async sendWelcomeEmail(to: string, name: string, loginLink: string): Promise<SentMessageInfo> {
    const template = await this.readTemplate('welcome-email.html');
    const html = this.replaceTemplateVariables(template, {
      name,
      loginLink,
    });

    return this.sendMail(
      to,
      'Welcome to Citi Voice!',
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
