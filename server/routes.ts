import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, setupAuthRoutes, isAuthenticated } from "./auth";
import { insertPropertySchema, insertProposalSchema, insertContractSchema, insertTimelineEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth middleware
  setupAuth(app);
  
  // Setup auth routes
  setupAuthRoutes(app);

  // Property routes
  app.get("/api/properties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.session.user.id);
      const properties = await storage.getProperties(userId);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Ensure user owns this property
      if (property.userId !== parseInt(req.session.user.id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // OAuth Google
  app.get("/api/auth/google", (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI!)}&scope=email profile&response_type=code&access_type=offline`;
    res.redirect(googleAuthUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.redirect("/login?error=auth_failed");
      }

      // Trocar código por token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        }),
      });

      const tokens = await tokenResponse.json();

      // Obter informações do usuário
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
      const googleUser = await userResponse.json();

      // Verificar se usuário já existe
      let user = await storage.getUserByEmail(googleUser.email);

      if (!user) {
        // Criar novo usuário
        user = await storage.createUser({
          email: googleUser.email,
          password: crypto.randomBytes(32).toString('hex'), // Password aleatória
          firstName: googleUser.given_name || googleUser.name.split(' ')[0],
          lastName: googleUser.family_name || googleUser.name.split(' ').slice(1).join(' '),
          profileImageUrl: googleUser.picture
        });
      }

      // Fazer login do usuário
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.redirect("/login?error=auth_failed");
    }
  });

  // OAuth Microsoft
  app.get("/api/auth/microsoft", (req, res) => {
    const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.MICROSOFT_REDIRECT_URI!)}&scope=openid profile email&response_type=code`;
    res.redirect(microsoftAuthUrl);
  });

  app.get("/api/auth/microsoft/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.redirect("/login?error=auth_failed");
      }

      // Trocar código por token
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        }),
      });

      const tokens = await tokenResponse.json();

      // Obter informações do usuário
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const microsoftUser = await userResponse.json();

      // Verificar se usuário já existe
      let user = await storage.getUserByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);

      if (!user) {
        // Criar novo usuário
        user = await storage.createUser({
          email: microsoftUser.mail || microsoftUser.userPrincipalName,
          password: crypto.randomBytes(32).toString('hex'), // Password aleatória
          firstName: microsoftUser.givenName || microsoftUser.displayName.split(' ')[0],
          lastName: microsoftUser.surname || microsoftUser.displayName.split(' ').slice(1).join(' ')
        });
      }

      // Fazer login do usuário
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Microsoft OAuth error:", error);
      res.redirect("/login?error=auth_failed");
    }
  });

  app.post("/api/properties", isAuthenticated, async (req: any, res) => {
    console.log("=== DADOS RECEBIDOS ===");
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", req.session.user.id);
    console.log("========================");

    try {
      const userId = parseInt(req.session.user.id);
      
      // Validar dados da propriedade
      const propertyData = {
        userId,
        type: req.body.type,
        street: req.body.street,
        number: req.body.number,
        complement: req.body.complement || null,
        neighborhood: req.body.neighborhood,
        city: req.body.city,
        state: req.body.state,
        cep: req.body.cep,
        value: req.body.value,
        registrationNumber: req.body.registrationNumber,
        municipalRegistration: req.body.municipalRegistration,
        status: "captacao",
        currentStage: 1,
      };

      // Criar propriedade
      const property = await storage.createProperty(propertyData);
      
      // Criar proprietários
      if (req.body.owners && req.body.owners.length > 0) {
        for (const owner of req.body.owners) {
          await storage.createPropertyOwner({
            propertyId: property.id,
            fullName: owner.fullName,
            cpf: owner.cpf,
            rg: owner.rg,
            birthDate: owner.birthDate,
            maritalStatus: owner.maritalStatus,
            fatherName: owner.fatherName,
            motherName: owner.motherName,
            phone: owner.phone,
            email: owner.email,
          });
        }
      }

      res.json(property);
    } catch (error) {
      console.error("=== ERRO DETALHADO ===");
      console.error("Error creating property:", error);
      if (error instanceof Error) {
        console.error("Stack:", error.stack);
      }
      console.error("======================");
      res.status(500).json({ message: "Failed to create property", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty || existingProperty.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const property = await storage.updateProperty(propertyId, req.body);

      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // Document routes
  app.get("/api/properties/:id/documents", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const documents = await storage.getPropertyDocuments(propertyId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Proposal routes
  app.get("/api/properties/:id/proposals", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const proposals = await storage.getPropertyProposals(propertyId);
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.post("/api/properties/:id/proposals", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const validatedData = insertProposalSchema.parse({
        ...req.body,
        propertyId,
      });
      
      const proposal = await storage.createProposal(validatedData);

      // Create timeline entry
      await storage.createTimelineEntry({
        propertyId,
        stage: 4,
        status: "in_progress",
        description: `Nova proposta recebida de ${proposal.buyerName}`,
        responsible: userId.toString(),
      });

      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  // Timeline routes
  app.get("/api/properties/:id/timeline", isAuthenticated, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const userId = parseInt(req.session.user.id);
      
      // Check ownership
      const property = await storage.getProperty(propertyId);
      if (!property || property.userId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      const timeline = await storage.getPropertyTimeline(propertyId);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.session.user.id);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.session.user.id);
      const recent = await storage.getRecentTransactions(userId);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}