# Olympiad - Algebra Tutor

An intelligent math tutoring application that provides step-by-step solutions, interactive graphing, and personalized quizzes using AI-powered agents. Built with Next.js 15 and Google's Gemini AI.

## 🚀 Features

### Core Tutoring Features
- **Step-by-Step Solutions**: AI-powered breakdown of algebra problems into clear, sequential steps
- **Interactive Whiteboard**: Visual equation display with MathJax rendering
- **Smart Scoping**: Automatically validates that problems are within algebra scope
- **Follow-up Questions**: Ask clarifying questions about any solution step
- **Interactive Quizzes**: Generate personalized quizzes based on solved problems

### Advanced Features
- **Graph Visualization**: Automatic graphing of linear equations with interactive SVG canvas
- **Rate Limiting**: Smart rate limiting system to prevent abuse
- **Analytics Dashboard**: Comprehensive usage tracking and visitor analytics
- **Visitor Tracking**: Fingerprint-based user identification for personalized experience
- **Email Collection**: Optional email signup for enhanced features

### Technical Features
- **AI Agent Architecture**: Modular agent system for different tutoring tasks
- **Real-time Analytics**: Redis-powered analytics with detailed visitor tracking
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

## 🏗️ Architecture

### AI Agent System
The application uses a specialized agent architecture with distinct roles:

- **ScopeAgent**: Validates if problems are within algebra scope
- **SolutionAgent**: Generates step-by-step solutions with LaTeX formatting
- **FollowUpAgent**: Handles follow-up questions about solution steps
- **QuizAgent**: Creates personalized multiple-choice quizzes
- **BaseAgent**: Common functionality for all AI agents

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Geist UI components
- **AI**: Google Gemini 2.5 Flash
- **Database**: Upstash Redis for analytics and rate limiting
- **State Management**: Zustand
- **Math Rendering**: MathJax
- **User Tracking**: FingerprintJS

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Upstash Redis account (for analytics and rate limiting)
- Google AI API key (for Gemini)

### Environment Variables
Create a `.env.local` file with the following variables:

```bash
# Google AI (Gemini) API Key
GOOGLE_GENAI_API_KEY=your_gemini_api_key

# Upstash Redis (for analytics and rate limiting)
NEXT_PUBLIC_UPSTASH_REDIS_REST_URL=your_upstash_redis_url
NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Optional: Admin features
NEXT_PUBLIC_ADMIN_KEY=your_admin_key_for_analytics_dashboard
```

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd olympiad
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your API keys and configuration

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### For Students
1. **Enter an algebra problem** in the input field
2. **View step-by-step solution** with detailed explanations
3. **Visualize graphs** for linear equations (when applicable)
4. **Ask follow-up questions** about any step
5. **Take quizzes** to test understanding
6. **Track progress** through the session

### For Administrators
- Access the analytics dashboard using the admin key
- View visitor statistics, usage patterns, and system metrics
- Monitor rate limiting and system health
- Debug visitor information and event timelines

## 🔧 Configuration

### Rate Limiting
- Default: 10 requests per day per visitor
- Configurable through Redis backend
- Automatic reset at midnight UTC

### Analytics Tracking
The system tracks various events:
- `problem_solved`: When a solution is generated
- `follow_up_asked`: When follow-up questions are submitted  
- `quiz_completed`: When quizzes are finished
- `session_started`: When users first visit

### Scope Limitations
Currently supports:
- ✅ Basic algebra (single-variable equations)
- ✅ Systems of linear equations
- ✅ Basic matrices and vectors
- ❌ Advanced linear algebra (eigenvalues, determinants)
- ❌ Calculus, statistics, logarithms

## 📁 Project Structure

```
olympiad/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── debug-visitor/ # Visitor debugging
│   │   └── rate-limit/    # Rate limiting
│   ├── dashboard/         # Admin dashboard
│   └── page.tsx          # Main application page
├── components/            # React components
│   ├── AnalyticsDashboard.tsx
│   ├── GraphCanvas.tsx
│   ├── RateLimitBanner.tsx
│   └── VisitorDebug.tsx
├── lib/                   # Core libraries
│   ├── agents/           # AI agent system
│   │   ├── baseAgent.ts
│   │   ├── scopeAgent.ts
│   │   ├── solutionAgent.ts
│   │   ├── followUpAgent.ts
│   │   └── quizAgent.ts
│   ├── analyticsService.ts
│   ├── rateLimitService.ts
│   ├── visitorStore.ts
│   ├── types.ts
│   └── utils.ts
└── public/               # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any Node.js hosting platform:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔍 API Endpoints

- `GET /api/analytics` - Retrieve analytics data (admin only)
- `GET /api/rate-limit` - Check rate limit status
- `POST /api/rate-limit` - Increment rate limit counter
- `GET /api/debug-visitor` - Debug visitor information (admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powering the tutoring agents
- Upstash for Redis infrastructure
- Next.js team for the excellent framework
- MathJax for mathematical notation rendering
