# Replit.md

## Overview

This is a comprehensive real estate management system called "Ventus Hub" built for Brazilian real estate brokers (corretores). The application digitizes and automates the complete real estate transaction lifecycle, from property acquisition to final contracts. It's built as a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence and Replit Auth for authentication.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with proper error handling

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication using PostgreSQL session store
- User profile management with Brazilian-specific fields (CPF, CRECI)
- Protected routes with middleware validation

### Property Management
- Complete property lifecycle tracking (7 stages)
- Property types: apartamento, casa, cobertura, terreno
- Owner information management with Brazilian documentation
- Document upload and management system

### Transaction Workflow
1. **Captação (Property Capture)** - Initial property registration
2. **Due Diligence** - Document validation and legal checks
3. **Mercado (Market Listing)** - Property marketing and portal integration
4. **Propostas (Proposals)** - Offer management and negotiation
5. **Contratos (Contracts)** - Contract generation and management
6. **Instrumento Definitivo (Final Instrument)** - Final documentation
7. **Timeline** - Complete process tracking and monitoring

### UI/UX Features
- Responsive design with mobile-first approach
- Dark/light theme support with system preference detection
- Comprehensive search and filtering capabilities
- Real-time progress tracking with visual indicators
- Brazilian Portuguese localization

## Data Flow

### Client-Side Data Management
- TanStack Query handles all server state with automatic caching
- Optimistic updates for better user experience
- Custom query client with authentication error handling
- Form validation using React Hook Form with Zod schemas

### Server-Side Data Processing
- RESTful API endpoints following conventional patterns
- Request/response logging middleware for debugging
- Comprehensive error handling with proper HTTP status codes
- Database operations using Drizzle ORM with type safety

### Real-Time Features
- Session-based authentication state management
- Automatic query invalidation on data mutations
- Progress tracking across property transaction stages

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection Pooling**: Built-in connection management
- **SSL Security**: Encrypted database connections

### Authentication Provider
- **Replit Auth**: OAuth 2.0/OpenID Connect integration
- **Session Storage**: PostgreSQL-based session persistence
- **User Profile Sync**: Automatic user data synchronization

### UI Component Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling framework
- **Shadcn/ui**: Pre-built component library

### Development Tools
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast JavaScript bundling
- **PostCSS**: CSS processing with Tailwind
- **TSX**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native Replit development environment
- **Hot Module Replacement**: Vite HMR for fast development
- **Development Server**: Express server with Vite middleware
- **Port Configuration**: Port 5000 with external port 80

### Production Build
- **Frontend Build**: Vite production build to `dist/public`
- **Backend Build**: ESBuild bundle to `dist/index.js`
- **Static Serving**: Express serves built React application
- **Environment Variables**: Database URL and session secrets

### Replit Deployment
- **Autoscale Target**: Configured for automatic scaling
- **Module Dependencies**: Node.js 20, Web, PostgreSQL 16
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

## Changelog

```
Changelog:
- June 21, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```