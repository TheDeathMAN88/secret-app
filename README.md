# Secret Chat

A secure, private messaging application for secret lovers with auto-deleting messages and real-time communication.

## 🌟 Features

- 🔒 **End-to-End Encryption** - Military-grade encryption for all messages
- ⏰ **Auto-Delete Messages** - Messages and files automatically delete after 30 days
- 🔔 **Discreet Notifications** - Notifications appear as generic system alerts
- 📁 **File Sharing** - Share photos and files with in-app viewing
- 👥 **Partner Connection** - Secure connection system with unique codes
- 🌐 **Real-time Messaging** - Instant messaging with Socket.io
- 📱 **2025 Design** - Modern, responsive UI with glassmorphism effects
- 🚀 **Production Ready** - Complete deployment setup included

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS + shadcn/ui
- **File Storage**: Local file system

## 🚀 Quick Start

### Development

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd secret-chat
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Prepare environment**
   ```bash
   # Edit .env with production values
   # Set strong secrets and production URLs
   ```

2. **Build and start**
   ```bash
   npm run build
   npm start
   ```

   Or use the startup script:
   ```bash
   ./scripts/start.sh
   ```

## 📱 How It Works

### For Users

1. **Sign Up/In** - Use any email and password (auto-signup for new users)
2. **Connect with Partner** - Generate a 6-digit connection code and share it
3. **Start Chatting** - Send messages, share files, all encrypted and private
4. **Auto-Delete** - All content automatically disappears after 30 days

### Connection Flow

1. User A generates a connection code (valid for 24 hours)
2. User A shares the code with User B
3. User B enters the code to connect
4. Secure conversation is created
5. Both users can now chat privately

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret key for authentication | Yes |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | Yes |
| `MAX_FILE_SIZE` | Maximum file upload size (bytes) | No |
| `AUTO_DELETE_INTERVAL` | Auto-delete interval (ms) | No |
| `NODE_ENV` | Environment (development/production) | No |

### Database Schema

The application uses the following main entities:

- **Users** - Authentication and profile information
- **Conversations** - Private chat between two users
- **Messages** - Text messages with auto-delete
- **MediaFiles** - File uploads with auto-delete
- **Connections** - Partner connection codes

## 🚀 Deployment Options

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

### Docker

```bash
# Build image
docker build -t secret-chat .

# Run container
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  secret-chat
```

### Traditional Server

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start ecosystem.config.js

# Or using Node.js
npm run build
NODE_ENV=production node server.js
```

## 🔒 Security Features

- **Authentication**: Secure login with NextAuth.js
- **Authorization**: Users can only access their own conversations
- **Auto-Delete**: Messages and files automatically removed after 30 days
- **Connection Codes**: Temporary codes expire after 24 hours
- **File Validation**: Size and type restrictions for uploads
- **HTTPS Ready**: Configuration for secure connections

## 📊 Monitoring

### Health Checks

- `GET /api/health` - Application health status
- `POST /api/cron/auto-delete` - Manual auto-delete trigger

### Logging

- Application logs via console output
- Database operations through Prisma
- Socket.io connection events
- PM2 logs in production

## 🛠️ Development

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── chat/           # Chat interface
│   ├── connect/        # Partner connection
│   └── page.tsx        # Landing page
├── components/         # React components
├── lib/               # Utilities and configurations
└── hooks/             # Custom React hooks
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the deployment guide in `deployment/README.md`
2. Review the troubleshooting section
3. Check application logs
4. Open an issue on GitHub

## 🌟 Acknowledgments

- Built with Next.js and modern web technologies
- UI components from shadcn/ui
- Icons from Lucide React
- Database management with Prisma
- Authentication with NextAuth.js

---

**Remember: This is a private messaging application. Always respect user privacy and data protection laws.**