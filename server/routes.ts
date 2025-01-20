import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import nodemailer from "nodemailer";

export function registerRoutes(app: Express): Server {
  // Email sending endpoint
  app.post("/api/send-invoice", async (req, res) => {
    try {
      const { to, subject, pdfBase64, invoiceNumber } = req.body;

      // Create a test SMTP transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: subject || `Invoice ${invoiceNumber}`,
        text: `Please find attached your invoice ${invoiceNumber}.`,
        attachments: [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            content: Buffer.from(pdfBase64, 'base64'),
            contentType: 'application/pdf',
          },
        ],
      };

      // Send email
      await transporter.sendMail(mailOptions);
      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Email sending failed:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // API routes would go here if needed
  // Currently we don't need any API routes as everything is handled client-side

  const httpServer = createServer(app);

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  return httpServer;
}