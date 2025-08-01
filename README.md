# Bus Driver Scheduling App

A comprehensive fullstack web application for managing bus drivers, buses, routes, and shift schedules with role-based access control.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control**: Admin, Dispatcher, and Viewer roles with specific permissions
- **Driver Management**: Create, read, update, and delete driver information
- **Bus Management**: Manage bus fleet with capacity tracking
- **Route Management**: Define origins, destinations, and estimated durations
- **Shift Scheduling**: Assign drivers to buses and routes with conflict prevention
- **Schedule Viewer**: View and filter shifts by date






## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Git

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd markoub_challenge
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Start PostgreSQL database
   - Build and start the Next.js application
   - Run database migrations
   - Seed the database with test data
   - Start the development server on http://localhost:3000

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

3. **Start PostgreSQL database**
   ```bash
   docker run --name postgres-bus-scheduler \
     -e POSTGRES_DB=bus_scheduler \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 -d postgres:15
   ```

4. **Run database migrations and seed**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔐 Test Credentials

The application comes with pre-seeded test users:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Admin** | `admin` | `admin123` | Full access to all features |
| **Dispatcher** | `dispatcher` | `dispatch123` | Can create/edit drivers, assign shifts, but cannot delete users or buses |
| **Viewer** | `viewer` | `view123` | Read-only access to all data |

## 📊 Database Schema

### Tables
- **users**: Authentication and role management
- **drivers**: Driver information and availability
- **buses**: Bus fleet with capacity details
- **routes**: Route definitions with duration estimates
- **shifts**: Shift assignments with conflict prevention

### Key Constraints
- Unique driver license numbers
- Unique bus plate numbers
- Scheduling conflict prevention (same driver/bus cannot have overlapping shifts)
- Foreign key relationships for data integrity

## 🔒 Role-Based Permissions

### Admin
- ✅ Create, read, update, delete all entities
- ✅ Manage user accounts
- ✅ Full system access

### Dispatcher
- ✅ Create and edit drivers
- ✅ Assign shifts and routes
- ✅ View all data
- ❌ Cannot delete users or buses

### Viewer
- ✅ View all data
- ❌ Cannot create, edit, or delete anything

