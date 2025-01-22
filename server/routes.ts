import type { Express } from "express";
import { createServer, type Server } from "http";
import nodemailer from "nodemailer";
import cors from "cors";

export function registerRoutes(app: Express): Server {
  // Enable CORS for all routes with proper configuration
  app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Handle OPTIONS requests
  app.options('*', cors());

  // PDF generation endpoint
  app.post("/api/generate-pdf", (req, res) => {
    try {
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      // Return success
      res.status(200).json({ message: "PDF generation endpoint ready" });
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      res.status(500).json({ 
        message: "Failed to generate PDF", 
        error: error.message 
      });
    }
  });

  // Email sending endpoint
  app.post("/api/send-invoice", async (req, res) => {
    try {
      const { to, pdfBase64, invoiceNumber } = req.body;

      // Validate request data
      if (!to || !pdfBase64 || !invoiceNumber) {
        throw new Error("Missing required fields: to, pdfBase64, or invoiceNumber");
      }

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error("Missing email credentials in environment variables");
        return res.status(500).json({ 
          message: "Email service not configured", 
          error: "Missing EMAIL_USER or EMAIL_PASSWORD environment variables"
        });
      }

      // Create SMTP transporter using Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        debug: true, // Enable debug output
      });

      // Verify transporter configuration
      try {
        await transporter.verify();
        console.log("SMTP connection verified successfully");
      } catch (verifyError) {
        console.error("SMTP verification failed:", verifyError);
        throw new Error("Failed to connect to email server");
      }

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
            <p>Met vriendelijke groet,</p>
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
        error: error.message 
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