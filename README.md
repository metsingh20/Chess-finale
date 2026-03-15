# Royal Chess Hub

A modern chess training platform for practicing opening lines and improving your game.

## Project Overview

Royal Chess Hub is a comprehensive chess training application that helps players master opening lines, analyze games, and track their progress.

## Features

- **Practice Mode**: Train with your custom opening repertoire
- **Analysis Board**: Analyze positions and games
- **Statistics**: Track your progress and identify areas for improvement
- **Custom Repertoire**: Import and practice your own opening lines via PGN

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

Follow these steps to set up the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd royal-chess-hub

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server with auto-reloading and an instant preview
npm run dev
```

### Configuration

1. Set up your Supabase project
2. Configure environment variables
3. Update the Supabase configuration in `src/integrations/supabase/client.ts`

## Technologies Used

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn-ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend and authentication
- **Chess.js** - Chess logic and validation

## Development

### Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and chess engine
├── pages/          # Page components
└── integrations/   # External service integrations
```

### Running Tests

```sh
npm run test
```

## Deployment

This project can be deployed to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

### Build for Production

```sh
npm run build
```

The built files will be in the `dist/` directory.

## Custom Domain

To connect a custom domain, configure your hosting provider's DNS settings to point to your deployment.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please open an issue in the GitHub repository.