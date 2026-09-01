# Mizan DZ

> **Modern business management software built for Algerian businesses.**

[Website](https://mizandz.com)

---

## Overview

**Mizan DZ** is a cloud-based business management platform designed for Algerian retailers, wholesalers, distributors, and small and medium-sized businesses.

It brings essential business operations into one platform, including customers, products, inventory, sales, invoices, payments, outstanding balances, and expenses.

Mizan is designed to simplify daily business operations and provide businesses with a centralized and organized way to manage their commercial activities.

## Features

* Customer management
* Product management
* Inventory and stock tracking
* Sales management
* Invoice management
* Payment tracking
* Outstanding balance and debt management
* Expense management
* Organization management
* Employee invitations
* Role-based access control
* Multi-tenant architecture
* Secure authentication
* Responsive web interface

## Core Workflow

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

Each organization operates within its own business environment, while access to business data is controlled through authentication, roles, and permissions.

## Tech Stack

* **Next.js**
* **TypeScript**
* **Tailwind CSS**
* **shadcn/ui**
* **Drizzle ORM**
* **PostgreSQL / Neon**
* **Better Auth**
* **Zod**
* **React Hook Form**

## Getting Started

### 1. Clone the repository

```bash
git clone [https://github.com/novadevDZ/mizan.git](https://github.com/novadevDZ/mizan-dz-platform.git)
cd mizan-dz-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Configure the required variables:

```env
DATABASE_URL="your_database_url"

BETTER_AUTH_SECRET="your_secure_secret"
BETTER_AUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

Never commit real credentials, API keys, database URLs, or authentication secrets.

### 4. Run database migrations

```bash
npm run db:generate
npm run db:migrate
```

Use the database scripts defined in `package.json` if your project configuration differs.

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Production deployments should use:

* Secure environment variables
* HTTPS
* Production database credentials
* Production authentication configuration
* Proper database migrations
* Monitoring and error logging

## Security

Mizan is built with a focus on secure business data management.

Key principles include:

* Server-side authorization
* Organization-level data isolation
* Secure authentication
* Input validation
* Protected environment variables
* Role-based access control
* HTTPS in production

Authentication and authorization are treated separately. Protected server operations must verify that the authenticated user is authorized to access the requested organization and resource.

## Project Structure

A simplified structure:

```text
src/
├── app/
├── components/
├── db/
├── lib/
├── hooks/
└── ...
```

The architecture may evolve as the product develops.

## Development Principles

### Business-first

Features should solve real business problems and improve daily operations.

### Simplicity

Common workflows should remain fast and easy to understand.

### Data isolation

Business data must remain isolated between organizations.

### Security

Authorization must be enforced on the server, not only through the user interface.

### Reliability

Production features should be stable, predictable, and maintainable.

## Roadmap

Potential future improvements include:

* Advanced business analytics
* Reporting
* Advanced inventory workflows
* Financial insights
* Automation
* Notifications
* Mobile experience
* Additional integrations
* Localization and multilingual support

The roadmap is subject to change based on customer needs and product priorities.

## Contributing

Issues, suggestions, and contributions are welcome.

For significant changes:

1. Open an issue describing the problem or proposal.
2. Explain the expected behavior.
3. Keep changes focused.
4. Verify that the application builds successfully.
5. Submit a pull request.

Never include credentials, tokens, private keys, or sensitive customer information in issues or pull requests.

## License

This project is currently **proprietary**.

All rights reserved unless otherwise stated.

## Status

**Mizan DZ is being prepared for production deployment.**

---

## Mizan DZ

**Manage your business from one place.**

[Website](https://mizandz.com)
