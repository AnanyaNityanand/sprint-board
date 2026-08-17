# Sprint Board Foundation

Sprint Board — Initial Build

Build a modern full-stack web application called Sprint Board.

Sprint Board is a collaborative project-management application built around a Kanban board. Users should be able to create projects, manage tasks, and collaborate with other members.

Goal

Create the initial production-quality foundation of the application. The architecture should be clean, modular, scalable, and easy for a developer to understand and extend.

Do not try to implement every advanced feature yet. Build the foundation properly so we can add real-time collaboration and other features incrementally.

Core Pages

Create these pages:

Landing Page

Product name: Sprint Board

Short description explaining the product

Clear "Get Started" / "Sign Up" CTA

Professional SaaS-style design

Responsive on desktop, tablet, and mobile

Authentication

Sign up

Login

Logout

Appropriate validation and error messages

Protect authenticated routes

Dashboard

Welcome section

List of projects belonging to the current user

Create Project button

Project cards showing project name, description, member count, and task progress

Project Page

Project name and description

Project members

Kanban board

Ability to create tasks

Ability to edit and delete tasks

Kanban Board

Create four default columns:

Todo

In Progress

Review

Done

Each task card should contain:

Task title

Short description

Priority

Assignee

Due date

Created date

Use a clean Kanban-style interface.

Prepare the task structure so that drag-and-drop task movement can be implemented later.

Projects

Users should be able to:

Create a project

View their projects

Open a project

Edit project details

Delete a project

Each project should have an owner.

Prepare the data model so that project members can be added later.

Data Model

Design a proper relational data model for:

Users

Projects

Project Members

Tasks

Tasks should belong to a project and optionally be assigned to a project member.

Include appropriate relationships, IDs, timestamps, and status/priority fields.

Do not duplicate data unnecessarily.

UI / UX

Use a modern professional SaaS dashboard aesthetic.

Requirements:

Clean typography

Consistent spacing

Responsive layout

Sidebar navigation for authenticated users

Clear buttons and forms

Loading states

Empty states

Error states

Confirmation before destructive actions

Accessible form controls

Professional visual hierarchy

Avoid excessive animations, gradients, or unnecessary visual effects.

Technical Requirements

Use a modern full-stack architecture supported by Lovable.

Keep components modular and reusable.

Separate UI components, business logic, and data-access logic where appropriate.

Use environment variables for secrets and configuration.

Do not hardcode user data or project data.

Implement proper authentication and authorization.

A user must not be able to access or modify projects they do not have permission to access.

Important

Do NOT implement these features yet:

Real-time collaboration

Live presence

Comments

Notifications

Activity feed

Advanced analytics

Chat

Email notifications

We will implement these incrementally after the core application is working.

Before making major architectural decisions, prioritize maintainability and simplicity.

The final result of this first stage should be a working foundation for Sprint Board that we can test and extend feature-by-feature.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b8832a13-3097-4af4-9496-64aa7369cb5a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
