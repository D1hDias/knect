import {
  users,
  properties,
  documents,
  proposals,
  contracts,
  timelineEntries,
  type User,
  type UpsertUser,
  type Property,
  type InsertProperty,
  type Document,
  type InsertDocument,
  type Proposal,
  type InsertProposal,
  type Contract,
  type InsertContract,
  type TimelineEntry,
  type InsertTimelineEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Property operations
  getProperties(userId: string): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty & { userId: string }): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property>;
  
  // Document operations
  getPropertyDocuments(propertyId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document>;
  
  // Proposal operations
  getPropertyProposals(propertyId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, proposal: Partial<InsertProposal>): Promise<Proposal>;
  
  // Contract operations
  getPropertyContracts(propertyId: number): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract>;
  
  // Timeline operations
  getPropertyTimeline(propertyId: number): Promise<TimelineEntry[]>;
  createTimelineEntry(entry: InsertTimelineEntry): Promise<TimelineEntry>;
  updateTimelineEntry(id: number, entry: Partial<InsertTimelineEntry>): Promise<TimelineEntry>;
  
  // Dashboard data
  getUserStats(userId: string): Promise<{
    captacao: number;
    mercado: number;
    propostas: number;
    contratos: number;
  }>;
  getRecentTransactions(userId: string): Promise<Property[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          cpf: userData.cpf,
          creci: userData.creci,
          phone: userData.phone,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Property operations
  async getProperties(userId: string): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.userId, userId))
      .orderBy(desc(properties.createdAt));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: InsertProperty & { userId: string }): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  // Document operations
  async getPropertyDocuments(propertyId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.propertyId, propertyId))
      .orderBy(desc(documents.uploadedAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  // Proposal operations
  async getPropertyProposals(propertyId: number): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.propertyId, propertyId))
      .orderBy(desc(proposals.createdAt));
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db
      .insert(proposals)
      .values(proposal)
      .returning();
    return newProposal;
  }

  async updateProposal(id: number, proposal: Partial<InsertProposal>): Promise<Proposal> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({ ...proposal, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return updatedProposal;
  }

  // Contract operations
  async getPropertyContracts(propertyId: number): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.propertyId, propertyId))
      .orderBy(desc(contracts.createdAt));
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract> {
    const [updatedContract] = await db
      .update(contracts)
      .set({ ...contract, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return updatedContract;
  }

  // Timeline operations
  async getPropertyTimeline(propertyId: number): Promise<TimelineEntry[]> {
    return await db
      .select()
      .from(timelineEntries)
      .where(eq(timelineEntries.propertyId, propertyId))
      .orderBy(desc(timelineEntries.createdAt));
  }

  async createTimelineEntry(entry: InsertTimelineEntry): Promise<TimelineEntry> {
    const [newEntry] = await db
      .insert(timelineEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateTimelineEntry(id: number, entry: Partial<InsertTimelineEntry>): Promise<TimelineEntry> {
    const [updatedEntry] = await db
      .update(timelineEntries)
      .set(entry)
      .where(eq(timelineEntries.id, id))
      .returning();
    return updatedEntry;
  }

  // Dashboard data
  async getUserStats(userId: string): Promise<{
    captacao: number;
    mercado: number;
    propostas: number;
    contratos: number;
  }> {
    const userProperties = await this.getProperties(userId);
    
    const captacao = userProperties.filter(p => p.currentStage === 1).length;
    const mercado = userProperties.filter(p => p.currentStage === 3).length;
    const propostas = userProperties.filter(p => p.currentStage === 4).length;
    const contratos = userProperties.filter(p => p.currentStage >= 5).length;

    return { captacao, mercado, propostas, contratos };
  }

  async getRecentTransactions(userId: string): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.userId, userId))
      .orderBy(desc(properties.updatedAt))
      .limit(5);
  }
}

export const storage = new DatabaseStorage();
