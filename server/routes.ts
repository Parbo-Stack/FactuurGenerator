import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { users, insertUserSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import cors from "cors";
import passport from 'passport';


export function registerRoutes(app: Express): Server {
  // Enable CORS with specific configuration for cross-browser support
  app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400 // Cache preflight requests for 24 hours
  }));

  // Handle preflight requests
  app.options('*', cors());

  // Set up authentication routes and middleware
  setupAuth(app);

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { username, password, email } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Create the new user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password,
          email,
        })
        .returning();

      // Log the user in after registration
      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { id: newUser.id, username: newUser.username },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).send("Invalid credentials");
    }

    passport.authenticate("local", (err: any, user: any) => { //Assuming Express.User is not available here.  Replace 'any' with correct type if available.
      if (err) {
        return res.status(500).send("Authentication error");
      }
      if (!user) {
        return res.status(401).send("Invalid credentials");
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).send("Login error");
        }
        return res.json({ 
          message: "Login successful",
          user: { id: user.id, username: user.username }
        });
      });
    })(req, res);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });

  // PDF generation endpoint
  app.post("/api/generate-pdf", (req, res) => {
    try {
      // Set headers for PDF download with cross-browser support
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="invoice.pdf"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Return success
      res.status(200).json({ 
        message: "PDF generation endpoint ready",
        success: true 
      });
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      res.status(500).json({ 
        message: "Failed to generate PDF", 
        error: error.message,
        success: false
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

  // Error handling middleware with improved browser support
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server error:", err);

    // Set CORS headers even for errors
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    });

    res.status(err.status || 500).json({
      message: err.message || 'Something broke!',
      success: false
    });
  });

  return httpServer;
}