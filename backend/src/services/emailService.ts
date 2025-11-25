import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;

      if (!emailUser || !emailPassword) {
        logger.warn('Email credentials not configured. Email service will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  private async loadTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'templates',
        `${templateName}.html`
      );

      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        logger.warn(`Template ${templateName} not found, using default`);
        return this.getDefaultTemplate(context);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);
      return template(context);
    } catch (error) {
      logger.error(`Error loading template ${templateName}:`, error);
      return this.getDefaultTemplate(context);
    }
  }

  private getDefaultTemplate(context: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${context.title || 'Leave Management System'}</h2>
            </div>
            <div class="content">
              ${context.message || ''}
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email transporter not configured. Email not sent.');
      return false;
    }

    try {
      const html = await this.loadTemplate(options.template, options.context);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@lms.com',
        to: options.to,
        subject: options.subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // Specific email templates
  async sendLeaveRequestNotification(
    to: string,
    userName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    totalDays: number
  ) {
    return this.sendEmail({
      to,
      subject: 'New Leave Request Submitted',
      template: 'leave-request',
      context: {
        title: 'New Leave Request',
        userName,
        leaveType,
        startDate,
        endDate,
        totalDays,
        message: `${userName} has submitted a leave request for ${leaveType} from ${startDate} to ${endDate} (${totalDays} days).`,
      },
    });
  }

  async sendLeaveApprovalNotification(
    to: string,
    userName: string,
    leaveType: string,
    approverName: string
  ) {
    return this.sendEmail({
      to,
      subject: 'Leave Request Approved',
      template: 'leave-approved',
      context: {
        title: 'Leave Request Approved',
        userName,
        leaveType,
        approverName,
        message: `Your leave request for ${leaveType} has been approved by ${approverName}.`,
      },
    });
  }

  async sendLeaveRejectionNotification(
    to: string,
    userName: string,
    leaveType: string,
    approverName: string,
    reason: string
  ) {
    return this.sendEmail({
      to,
      subject: 'Leave Request Rejected',
      template: 'leave-rejected',
      context: {
        title: 'Leave Request Rejected',
        userName,
        leaveType,
        approverName,
        reason,
        message: `Your leave request for ${leaveType} has been rejected by ${approverName}. Reason: ${reason}`,
      },
    });
  }

  async sendLeaveCancellationNotification(
    to: string,
    userName: string,
    leaveType: string
  ) {
    return this.sendEmail({
      to,
      subject: 'Leave Request Cancelled',
      template: 'leave-cancelled',
      context: {
        title: 'Leave Request Cancelled',
        userName,
        leaveType,
        message: `${userName} has cancelled their leave request for ${leaveType}.`,
      },
    });
  }

  async sendCompOffRequestNotification(
    to: string,
    userName: string,
    workDate: string,
    workHours: number
  ) {
    return this.sendEmail({
      to,
      subject: 'New Comp Off Request',
      template: 'compoff-request',
      context: {
        title: 'New Comp Off Request',
        userName,
        workDate,
        workHours,
        message: `${userName} has submitted a comp off request for working ${workHours} hours on ${workDate}.`,
      },
    });
  }

  async sendCompOffApprovalNotification(
    to: string,
    userName: string,
    compOffDays: number
  ) {
    return this.sendEmail({
      to,
      subject: 'Comp Off Request Approved',
      template: 'compoff-approved',
      context: {
        title: 'Comp Off Request Approved',
        userName,
        compOffDays,
        message: `Your comp off request has been approved. You have been credited with ${compOffDays} comp off days.`,
      },
    });
  }

  async sendAccrualNotification(
    to: string,
    userName: string,
    leaveType: string,
    accruedDays: number,
    totalBalance: number
  ) {
    return this.sendEmail({
      to,
      subject: 'Leave Balance Updated',
      template: 'accrual-notification',
      context: {
        title: 'Leave Balance Updated',
        userName,
        leaveType,
        accruedDays,
        totalBalance,
        message: `Your ${leaveType} balance has been updated. ${accruedDays} days have been added. Your new balance is ${totalBalance} days.`,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        title: 'Password Reset Request',
        resetUrl,
        message: `You have requested to reset your password. Click the link below to reset your password. This link will expire in 1 hour.`,
      },
    });
  }

  async sendWelcomeEmail(to: string, userName: string, tempPassword: string) {
    return this.sendEmail({
      to,
      subject: 'Welcome to Leave Management System',
      template: 'welcome',
      context: {
        title: 'Welcome to LMS',
        userName,
        tempPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        message: `Welcome to the Leave Management System! Your account has been created. Please use the temporary password provided to login and change your password.`,
      },
    });
  }
}

export default new EmailService();
