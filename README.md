# Code Lab

Code Lab is a modern code review and project management platform built for developers, reviewers, and administrators. It facilitates seamless code submission, review processes, and system administration.

## Features

- **Role-Based Access Control**:
  - **Developer Dashboard**: Submit code, track submission status, and manage profile variables.
  - **Reviewer Dashboard**: Review submitted code, provide feedback, and manage review queues.
  - **Admin Dashboard**: Comprehensive system management, user oversight, and activity logging.
- **Authentication**: Secure login and registration flows.
- **Modern UI**: Built with Shadcn UI and Tailwind CSS for a responsive, clean experience.
- **Real-time Updates**: Powered by React Query for efficient data fetching.

## Tech Stack

- **Frontend**: React, Vite
- **Styling**: Tailwind CSS, Shadcn UI
- **State/Data**: React Query, Context API
- **Backend/Auth**: Supabase
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/code-lab.git
   cd code-lab
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Supabase credentials (and any other required variables):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

- Navigate to `http://localhost:5173` (or the port shown in your terminal).
- Register a new account or login.
- Access dashboards based on your assigned role.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
