# Portfolio Website Ilramdhan.dev

A modern, responsive portfolio website built with React, Vite, Tailwind CSS, and Supabase. This project showcases a developer's profile, projects, blog posts, and technical skills with a clean and interactive UI.

## 🚀 Features

*   **Dynamic Content Management**: Powered by Supabase for easy management of projects, blogs, experience, education, and more.
*   **Responsive Design**: Fully responsive layout optimized for all devices using Tailwind CSS.
*   **Dark/Light Mode**: Seamless theme switching with persistent preference.
*   **Interactive UI**: Animations powered by Framer Motion and 3D effects with Vanta.js/Three.js.
*   **Blog System**: Markdown-supported blog posts with commenting functionality.
*   **Project Showcase**: Detailed project pages with image galleries, tech stacks, and links.
*   **Resume/CV Section**: Display of work experience, education, and certifications.
*   **Wakatime Integration**: Real-time coding stats visualization.
*   **Admin Dashboard**: Secure admin area for managing all content (protected by Supabase Auth).

## 🛠 Tech Stack

### Frontend
*   **Framework**: [React](https://react.dev/) (with [Vite](https://vitejs.dev/))
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Routing**: [React Router](https://reactrouter.com/)
*   **State Management/Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/), [Vanta.js](https://www.vantajs.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown)
*   **Charts**: [Recharts](https://recharts.org/)

### Backend / Services
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Authentication**: Supabase Auth
*   **Storage**: Supabase Storage (for images and files)

## 📂 Project Structure

```
/
├── actions/            # Client-triggered action handlers used by the SPA
├── api/                # API related files
├── app/                # Main application pages and layouts
│   ├── admin/          # Admin dashboard components
│   ├── about.tsx       # About page
│   ├── blog.tsx        # Blog listing page
│   ├── blog-detail.tsx # Individual blog post page
│   ├── login.tsx       # Admin login page
│   ├── page.tsx        # Home page
│   ├── projects.tsx    # Projects listing page
│   └── ...
├── components/         # Reusable UI components
│   ├── Hero.tsx        # Homepage hero section
│   ├── Navbar.tsx      # Navigation bar
│   ├── ProjectCard.tsx # Project display card
│   └── ...
├── lib/                # Utility functions and configurations
│   ├── supabase/       # Supabase client setup
│   ├── api.ts          # API service functions for data fetching
│   ├── database.types.ts # TypeScript definitions for Supabase tables
│   └── ...
├── experimental/       # Archived or optional modules not used in current production runtime
├── public/             # Static assets
└── ...
```

## 🗄️ Database Schema

The project uses the following tables in Supabase:

*   `profile`: User profile information (bio, social links, avatar, etc.).
*   `projects`: Portfolio projects with details, images, and tags.
*   `blogs`: Blog posts with markdown content.
*   `resume`: Work experience and education entries.
*   `services`: Services offered by the developer.
*   `certificates`: Certifications and awards.
*   `tech_stack`: Technologies and skills with icons.
*   `messages`: Contact form submissions.
*   `blog_comments`: Comments on blog posts.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A Supabase project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

    - [ ] Never expose non-`VITE_` secrets to frontend bundle


4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Build for production**
    ```bash
    npm run build
    ```

## 📝 License

This project is licensed under the MIT License.
