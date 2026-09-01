# Mizan DZ

> **Cloud-based business management software built for Algerian businesses, retailers, and wholesalers.**

[Website](https://mizandz.com)

## Overview

**Mizan DZ** is a modern cloud-based business management platform designed for Algerian businesses, retailers, wholesalers, distributors, and small and medium-sized businesses.

Mizan brings core business operations into one centralized platform, making it easier to manage customers, products, inventory, sales, invoices, payments, outstanding balances, and expenses.

The platform is built with a focus on simplicity, organization, secure access, and business data isolation.

## Features

* Customer management
* Product management
* Inventory and stock tracking
* Sales management
* Invoice management
* Payment tracking
* Outstanding balances and debt management
* Expense management
* Organization management
* Employee invitations
* Role-based access control
* Multi-tenant architecture
* Secure authentication
* Responsive web interface

## Core Business Flow

```text
Customer
   ↓
Sale
   ↓
Sale Items
   ↓
Payment
   ↓
Outstanding Balance
   ↓
Invoice
   ↓
Inventory Update
```

## Architecture

Mizan uses a multi-tenant architecture designed to isolate business data between organizations.

```text
User
 │
 ▼
Organization
 │
 ├── Members
 ├── Customers
 ├── Products
 ├── Inventory
 ├── Sales
 ├── Sale Items
 ├── Payments
 ├── Invoices
 └── Expenses
```

Business access is organization-scoped and controlled through authentication, roles, and permissions.

## Technology Stack

| Technology        | Purpose                          |
| ----------------- | -------------------------------- |
| Next.js 16        | Full-stack web application       |
| React 19          | User interface                   |
| TypeScript        | Type safety                      |
| Tailwind CSS      | Styling                          |
| shadcn/ui         | UI components                    |
| Drizzle ORM       | Database access                  |
| PostgreSQL / Neon | Database                         |
| Better Auth       | Authentication and organizations |
| Zod               | Validation                       |
| React Hook Form   | Form handling                    |
| Resend            | Email delivery                   |

## Project Structure

```text
src/
├── app/           # Application routes and pages
├── components/    # Reusable UI components
├── db/            # Database schema and configuration
├── hooks/         # React hooks
└── lib/           # Shared libraries and application logic
```

## Getting Started

### Prerequisites

Make sure you have:

* Node.js
* npm
* PostgreSQL-compatible database
* Git

### Clone the repository

```bash
git clone https://github.com/novadevDZ/mizan-dz-platform.git
cd mizan-dz-platform
```

### Install dependencies

```bash
npm install
```

### Environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Configure the environment variables required by the application.

Typical configuration includes:

```env
DATABASE_URL="your_database_url"

BETTER_AUTH_SECRET="your_secure_secret"
BETTER_AUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

Additional environment variables may be required depending on the enabled integrations.

> Never commit real secrets, API keys, database credentials, OAuth secrets, or authentication tokens to the repository.

### Database

Generate the Drizzle migration files:

```bash
npm run db:generate
```

Push the current schema to the configured database:

```bash
npm run db:push
```

> Review your database workflow carefully before using `db:push` against a production database.

### Run the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

## Available Scripts

The project currently provides the following npm scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:push
```

### Production build

```bash
npm run build
```

### Production server

```bash
npm run start
```

### Lint

```bash
npm run lint
```

## Production Deployment

Mizan is designed to run as a modern Next.js application and can be deployed to platforms that support Next.js, including Vercel.

A typical production architecture is:

```text
GitHub
   │
   ▼
Vercel
   │
   ├── Next.js Application
   │
   └── Environment Variables
             │
             ▼
       Neon PostgreSQL
```

### Production checklist

Before deploying:

* Configure production environment variables.
* Configure the production database.
* Set the production Better Auth URL.
* Configure Google OAuth for the production domain.
* Verify database schema and migrations.
* Run a successful production build.
* Verify authentication and authorization.
* Verify organization isolation.
* Test critical business workflows.
* Enable HTTPS.
* Configure monitoring and error tracking as needed.

## Security

Mizan handles business-related data, so security and authorization are fundamental parts of the architecture.

The application is designed around:

* Server-side authorization
* Organization-scoped data access
* Role-based access control
* Secure authentication
* Input validation
* Protected environment variables
* HTTPS in production

Authentication and authorization are separate concerns.

A valid authenticated session does not automatically grant access to every organization or resource. Protected server operations must verify that the current user is authorized to access the requested organization and data.

## Data Isolation

Mizan follows an organization-based model:

```text
User → Organization → Business Data
```

Business records such as customers, products, sales, invoices, payments, and expenses must remain scoped to the correct organization.

This is a core requirement of the multi-tenant architecture.

## Development Principles

### Business-first

Features should solve concrete business problems and improve daily operations.

### Simplicity

Common workflows should remain fast, predictable, and easy to understand.

### Security

Authorization must be enforced on the server and must not rely only on frontend visibility.

### Maintainability

Code should remain modular, typed, testable, and understandable as the product grows.

### Reliability

Production features should be stable and predictable under real-world usage.

## Current Scope

Mizan currently focuses on the core operational needs of businesses:

```text
Customers
Products
Inventory
Sales
Invoices
Payments
Outstanding Balances
Expenses
Organizations
Employees
Permissions
```

The product is currently delivered with an **English-language interface**.

## Roadmap

Future development may include:

* Advanced analytics
* Business reporting
* Improved inventory workflows
* Financial insights
* Automation
* Notifications
* Mobile experience
* Additional integrations
* Multilingual support
* Arabic and French localization

The roadmap may change according to customer requirements and product priorities.

## Contributing

This repository is primarily maintained as the codebase for Mizan DZ.

For bugs, improvements, or technical proposals:

1. Open an issue.
2. Clearly describe the problem or proposed change.
3. Include relevant reproduction steps when applicable.
4. Keep pull requests focused.
5. Verify that the project builds successfully.

Never include:

* Passwords
* API keys
* OAuth secrets
* Database credentials
* Authentication tokens
* Private customer information

in issues, pull requests, screenshots, or commits.

## License

Mizan DZ is proprietary software.

All rights reserved.

The source code is provided for authorized development and maintenance purposes only. Redistribution, resale, sublicensing, or unauthorized commercial use is not permitted without explicit permission from the project owner.

## Status

**Active development — preparing for production deployment.**

---

## Mizan DZ

**Manage your business from one place.**

[Website](https://mizandz.com)
