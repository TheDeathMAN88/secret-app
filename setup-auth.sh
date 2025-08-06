#!/bin/bash

echo "Setting up NextAuth authentication..."

# Create the required [...nextauth] directory structure
echo "Creating NextAuth route structure..."
mkdir -p "src/app/api/auth/[...nextauth]"

# Create the route file
cat > "src/app/api/auth/[...nextauth]/route.ts" << 'EOF'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
EOF

echo "✅ NextAuth setup complete!"
echo ""
echo "The authentication system is now ready to use."
echo ""
echo "To use this project:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Visit http://localhost:3000"
echo "3. Test the authentication by signing up and signing in"
echo ""
echo "Note: The [...nextauth] folder will be ignored by GitHub via .gitignore"