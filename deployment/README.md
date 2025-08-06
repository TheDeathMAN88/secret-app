# Secret Chat - Deployment Guide

## Overview
Secret Chat is a secure messaging application built with Next.js, featuring end-to-end encryption, auto-deleting messages, and real-time communication.

## Features
- 🔒 End-to-end encrypted messaging
- ⏰ Auto-delete messages after 30 days
- 🔔 Discreet notifications
- 📁 File sharing with in-app viewing
- 👥 Partner connection system
- 🌐 Real-time messaging with Socket.io
- 📱 Responsive 2025 design

## Technology Stack
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS + shadcn/ui
- **File Storage**: Local file system

## Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secret-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=file:./dev.db
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-super-secret-key-here
   NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
   NODE_ENV=production
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Start the application**
   ```bash
   npm start
   ```

## Deployment Options

### 1. Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

### 2. Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t secret-chat .
   ```

2. **Run container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL=file:/app/data/db.sqlite \
     -e NEXTAUTH_URL=https://your-domain.com \
     -e NEXTAUTH_SECRET=your-secret-key \
     secret-chat
   ```

### 3. Traditional Server

1. **Upload files to server**
2. **Install dependencies**
   ```bash
   npm install --production
   ```
3. **Build application**
   ```bash
   npm run build
   ```
4. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | SQLite database connection string | Yes | - |
| `NEXTAUTH_URL` | URL of your application | Yes | - |
| `NEXTAUTH_SECRET` | Secret key for NextAuth | Yes | - |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | Yes | - |
| `MAX_FILE_SIZE` | Maximum file upload size (bytes) | No | 52428800 |
| `AUTO_DELETE_INTERVAL` | Auto-delete cron interval (ms) | No | 3600000 |
| `NODE_ENV` | Environment | No | development |

## Security Considerations

### Production Setup
1. **Use strong secrets**
   ```bash
   openssl rand -base64 32
   ```

2. **Enable HTTPS**
   - Use reverse proxy (Nginx/Apache)
   - Configure SSL certificates

3. **File uploads**
   - Limit file types and sizes
   - Scan uploaded files for malware
   - Consider using cloud storage for production

4. **Database security**
   - Regular backups
   - Proper file permissions
   - Monitor database size

5. **Rate limiting**
   - Implement API rate limiting
   - Limit authentication attempts

## Monitoring

### Health Checks
- `/api/health` - Application health status
- `/api/cron/auto-delete` - Manual auto-delete trigger

### Logging
- Application logs: Check console output
- Database operations: Prisma query logging
- Socket.io connections: Connection logs

## Scaling

### Horizontal Scaling
- Use load balancer
- Multiple application instances
- Shared database (consider PostgreSQL for large scale)

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use caching (Redis)

## Backup Strategy

### Database Backups
```bash
# SQLite backup
sqlite3 dev.db ".backup backup-$(date +%Y%m%d).db"
```

### File Backups
- Regular uploads directory backups
- Version control for application code

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL
   - Verify file permissions
   - Ensure SQLite is installed

2. **Authentication issues**
   - Verify NEXTAUTH_URL matches domain
   - Check NEXTAUTH_SECRET
   - Clear browser cookies

3. **Socket.io connection issues**
   - Verify NEXT_PUBLIC_SOCKET_URL
   - Check firewall settings
   - Ensure WebSocket support

4. **File upload failures**
   - Check disk space
   - Verify file permissions
   - Check MAX_FILE_SIZE setting

### Performance Optimization

1. **Database optimization**
   - Add indexes for frequent queries
   - Clean up expired data regularly
   - Monitor query performance

2. **Frontend optimization**
   - Enable compression
   - Use CDN for static assets
   - Implement lazy loading

3. **Server optimization**
   - Enable caching
   - Use worker processes
   - Monitor memory usage

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Open an issue on GitHub

## License

This project is licensed under the MIT License.