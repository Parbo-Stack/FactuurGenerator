import type { Express } from "express";
import { createServer, type Server } from "http";
import nodemailer from "nodemailer";

export function registerRoutes(app: Express): Server {
  // Email sending endpoint
  app.post("/api/send-invoice", async (req, res) => {
    try {
      const { to, pdfBase64, invoiceNumber } = req.body;

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error("Email credentials not configured");
      }

      // Create SMTP transporter using Gmail
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `Factuur ${invoiceNumber}`,
        text: `Hierbij ontvangt u uw factuur ${invoiceNumber}.`,
        html: `
          <div>
            <p>Beste,</p>
            <p>Hierbij ontvangt u uw factuur ${invoiceNumber}.</p>
            <p>Met vriendelijke groet,<br>Factuur Generator</p>
          </div>
        `,
        attachments: [
          {
            filename: `factuur-${invoiceNumber}.pdf`,
            content: Buffer.from(pdfBase64, 'base64'),
            contentType: 'application/pdf',
          },
        ],
      };

      // Send email
      await transporter.sendMail(mailOptions);
      res.json({ message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Email sending failed:", error);
      res.status(500).json({ 
        message: "Failed to send email", 
        error: error.message || "Unknown error occurred" 
      });
    }
  });

  const httpServer = createServer(app);

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  return httpServer;
}