# SalonManager

## Overview

SalonManager is a full-stack web application for professional salon management, designed specifically for hair salons in Germany. The platform enables customers to discover salons, book appointments online, and manage their bookings, while providing salon owners and stylists with comprehensive business management tools. The application features a multi-role system supporting platform owners, salon owners, stylists, and customers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system featuring gold accent colors
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: Replit's OpenID Connect integration with session-based auth
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API endpoints with consistent error handling
- **File Structure**: Shared schema definitions between client and server

### Database Design
- **Primary Database**: PostgreSQL (via Neon serverless)
- **Schema Management**: Drizzle migrations with TypeScript schemas
- **Key Entities**: Users, Salons, Services, Stylists, Bookings, Work Hours, Absences
- **Relationships**: Proper foreign key constraints and data integrity
- **Session Storage**: PostgreSQL-backed session store for authentication

### Authentication & Authorization
- **Provider**: Replit OAuth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Role-Based Access**: Four-tier system (owner, salon_owner, stylist, customer)
- **Security**: HTTP-only cookies with secure session handling

### Multi-Tenant Architecture
- **Salon Isolation**: Each salon operates independently within the platform
- **Role Hierarchy**: Platform owners can manage all salons, salon owners manage their specific salon
- **Data Segregation**: Proper data isolation between different salon entities

### Booking System
- **Appointment Wizard**: Multi-step booking flow (service → stylist → date/time → confirmation)
- **Availability Management**: Real-time slot calculation based on stylist work hours and existing bookings
- **Status Management**: Booking lifecycle (requested → confirmed/declined → completed)
- **Conflict Prevention**: Server-side validation to prevent double bookings

### Geographic Features
- **Location Services**: Integrated mapping with Leaflet for salon discovery
- **Coordinate Storage**: Precise lat/lng coordinates for each salon location
- **Address Management**: Full address support with phone and email contact information

### Development Workflow
- **Build System**: Vite for frontend, ESBuild for backend production builds
- **Development Server**: Hot module replacement with error overlay
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Path Aliases**: Organized import structure with @ and @shared aliases

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Database toolkit and migration system
- **Connect-PG-Simple**: PostgreSQL session store for Express

### Authentication Services
- **Replit OAuth**: Primary authentication provider
- **OpenID Connect**: Standard authentication protocol implementation

### UI & Styling Framework
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Frontend build tool and development server
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Runtime type validation and schema definition

### Mapping & Location
- **Leaflet**: Open-source mapping library for salon discovery
- **OpenStreetMap**: Map tile provider for geographic data

### Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **Clsx/Tailwind-merge**: Conditional CSS class utilities
- **Nanoid**: Unique ID generation for entities