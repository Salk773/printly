# Printly - 3D Printing Marketplace

A modern e-commerce platform for 3D printed products, built with Next.js 14 and Supabase.

## Features

- 🛍️ **Product Catalog** - Browse and search 3D printed products
- 🛒 **Shopping Cart** - Add items to cart and manage quantities
- ❤️ **Wishlist** - Save favorite products for later
- 📦 **Order Management** - Place orders with delivery details
- 📧 **Email Notifications** - Automated order confirmations
- 👤 **User Authentication** - Secure login and registration
- 🎨 **Admin Panel** - Manage products, categories, and orders
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Inline styles (CSS-in-JS)
- **Notifications**: react-hot-toast
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd printly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   See [ENVIRONMENT.md](./ENVIRONMENT.md) for detailed environment variable documentation.

4. **Set up Supabase database**
   
   You'll need to create the following tables in your Supabase project:
   - `products` - Product catalog
   - `categories` - Product categories
   - `orders` - Customer orders
   - `users` - User accounts (handled by Supabase Auth)

   See your Supabase dashboard for schema details.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
printly/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout flow
│   ├── products/          # Product pages
│   └── admin/             # Admin panel
├── components/             # React components
├── context/               # React context providers
├── lib/                   # Utility functions
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See [ENVIRONMENT.md](./ENVIRONMENT.md) for complete documentation of all environment variables.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Features in Detail

### Email Notifications

The application sends automated emails when orders are placed:
- **Customer Confirmation** - Sent to the customer with order details
- **Admin Notification** - Sent to admin email (info@printly.ae) for new orders

Email functionality uses Supabase Edge Functions. See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup instructions.

### Error Handling

- React Error Boundaries for component-level error handling
- Next.js error.tsx for route-level errors
- Toast notifications for user-facing errors (replaces browser alerts)
- Comprehensive form validation

### Security

- Input sanitization on all user inputs
- Row Level Security (RLS) in Supabase
- Secure authentication via Supabase Auth
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

See [LICENSE](./LICENSE) file for details.

## Support

For support, email info@printly.ae or open an issue in the repository.
