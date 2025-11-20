# Task Scheduler Platform Frontend

A modern React-based user interface for the Task Scheduler Platform.

## Features

- **Schedule Tasks**: Create new scheduled tasks with cron expressions
- **Task Management**: View, cancel, and retry tasks
- **Task Search**: Search for specific tasks by Message ID
- **Real-time Status**: View task status and execution details

## Technology Stack

- React 18
- Ant Design (UI Components)
- Axios (HTTP Client)
- React Router (Navigation)
- Day.js (Date handling)
- Cronstrue (Cron expression parsing)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend service running on http://localhost:8080

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

The application will open at http://localhost:3000

### Build for Production

```bash
npm run build
```

## API Integration

The frontend communicates with the backend REST API:

- `POST /api/tasks` - Create new task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/{id}` - Get task by ID
- `PUT /api/tasks/{id}` - Update task
- `POST /api/tasks/{id}/cancel` - Cancel task
- `POST /api/tasks/{id}/retry` - Retry task

## Components

- **TaskForm**: Create and schedule new tasks
- **TaskList**: View and manage all tasks
- **TaskSearch**: Search for tasks by Message ID
