
# NutMeg CRM

NutMeg CRM is a modern, full-stack Customer Relationship Management application designed to manage customers, deals, and support interactions efficiently.

## Features

  - **Customer Management:** Create, read, update, and delete customer profiles.
  - **Sales Pipeline:** A visual (Kanban-style) sales pipeline to track deals from "New Lead" to "Negotiation."
  - **Support Ticketing:** A complete system for managing customer support tickets and responses.
  - **Activity Logging:** Track all key interactions (new customers, new deals, ticket status changes) in a central feed.
  - **Customer Segmentation:** Group customers into dynamic segments based on value, industry, or other criteria.
  - **Interaction Tracking:** Log all calls, emails, and meetings associated with a customer.

## Tech Stack

  - **Frontend:** React, Vite, TypeScript, Tailwind CSS
  - **Backend:** Node.js, Express.js
  - **Database:** PostgreSQL
  - **Styling:** Shadcn UI, Tailwind CSS

## Project Structure

Your project is organized into three main parts:

```
/
├── backend/          # Contains the Node.js API server
├── db_scripts/       # Holds the .sql file to set up the database
├── src/              # All frontend React/Vite/TS source code
├── .env              # Backend environment variables
├── .gitignore        # Specifies files for Git to ignore
├── package.json      # Project dependencies and scripts
└── vite.config.ts    # Vite configuration
```

## Setup and Installation

Follow these steps to get your project running locally.

### Prerequisites

  - [Node.js](https://nodejs.org/) (v18 or later recommended)
  - [PostgreSQL](https://www.postgresql.org/) (v14 or later recommended)

### 1\. Database Setup

1.  Make sure your PostgreSQL server is running.
2.  Create a new database (e.g., `ncrm_db`).
3.  Open the `db_scripts/MARM_setup.sql` file (or your script's name) in a SQL client (like DBeaver or `psql`).
4.  Run the entire script to create the `MARM` schema, all tables, functions, and triggers.

### 2\. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install backend dependencies:
    ```bash
    npm install
    ```
3.  Create an environment file:
    ```bash
    cp .env.example .env
    ```
4.  Edit the `.env` file with your database credentials (see `.env` template below).
5.  Start the backend server:
    ```bash
    npm run dev
    ```
    Your API should now be running on `http://localhost:3001`.

### 3\. Frontend Setup

1.  From the **root** project directory, install the frontend dependencies:
    ```bash
    npm install
    ```
2.  Run the frontend development server:
    ```bash
    npm run dev
    ```
    Your application should now be running and accessible at `http://localhost:5173` (or whatever port Vite specifies).

-----

## Environment Variables (`backend/.env`)

Your backend needs a `.env` file with the following keys.

```env
# PostgreSQL Database Connection
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=ncrm_db
DB_PASSWORD=your_secret_password
DB_PORT=5432

# API Server Port
PORT=3001

# Base URL for the frontend (used for CORS)
VITE_API_BASE_URL=http://localhost:5173
```

## Available Scripts

In the **root directory**, you can run:

  - `npm run dev`: Starts the frontend Vite development server.
  - `npm run build`: Builds the frontend application for production.
  - `npm run preview`: Previews the production build locally.

In the **`backend/` directory**, you can run:

  - `npm run dev`: Starts the backend Node.js server using `nodemon`.
  - `npm run start`: Starts the backend server in production mode.

