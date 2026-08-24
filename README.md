# Sprint Board

A real-time collaborative project management application that helps teams organize projects, manage tasks, and collaborate through a Kanban-based workflow.

## Features

### Project Management

* Create, edit, and delete projects
* Manage project details and members
* View project progress and task information
* Role-based project ownership and membership

### Kanban Task Management

* Organize tasks across four workflow stages:

  * Todo
  * In Progress
  * Review
  * Done
* Create, edit, and delete tasks
* Assign task priorities
* Add descriptions, due dates, and assignees
* Drag and drop tasks between workflow stages
* Persist task status changes to the database

### Real-Time Collaboration

* Live presence indicators for project members
* Real-time updates using Supabase Realtime
* Collaborative project workspace experience

### Task Comments

* Add comments to tasks
* View discussions associated with individual tasks
* Support collaboration between project members

### Notifications

* In-app notification system
* Unread notification count
* Mark individual notifications as read
* Mark all notifications as read
* Real-time notification updates

### Authentication & Security

* User authentication with Supabase
* Protected application routes
* Row Level Security policies for database access
* User-based access control for projects and related resources

## Tech Stack

* **Frontend:** React
* **Language:** TypeScript
* **Routing:** TanStack Router
* **Server State Management:** TanStack Query
* **Backend & Database:** Supabase
* **Authentication:** Supabase Auth
* **Real-Time Features:** Supabase Realtime
* **Drag and Drop:** dnd-kit
* **Styling & UI:** Tailwind CSS and reusable UI components
* **Build Tool:** Vite

## Project Structure

```text
src/
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
├── integrations/        # Authentication and Supabase integration
├── lib/
│   ├── api/             # Database and API operations
│   └── types.ts         # Shared TypeScript types
├── routes/              # Application routes
└── styles.css           # Global styles

supabase/
└── migrations/          # Database schema and migrations
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* A Supabase project

### Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Navigate to the project directory:

```bash
cd sprint-board
```

Install dependencies:

```bash
npm install
```

Create your environment configuration and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in your terminal.

## Database

The application uses Supabase for:

* Authentication
* PostgreSQL database
* Row Level Security
* Real-time subscriptions
* Project and member management
* Tasks and comments
* Notifications

Database schema changes are managed through the migration files inside:

```text
supabase/migrations
```

## Key Learning Areas

This project was built to explore and practice:

* Full-stack application development
* Type-safe React development with TypeScript
* Authentication and authorization
* Relational database design
* Row Level Security
* Real-time application features
* State management with TanStack Query
* Drag-and-drop interactions
* Collaborative application design

## Future Improvements

Potential future enhancements include:

* Activity history
* File attachments
* Advanced filtering and search
* Task labels
* Email notifications
* Team analytics
* Project activity feed
* Mobile-specific optimizations

## Author

Built and maintained by **Ananya Nityanand**.
