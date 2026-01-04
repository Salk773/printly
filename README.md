# Printly

A modern 3D printing marketplace and e-commerce platform built with Next.js 14 and Supabase.

## Features

- 🛍️ **E-commerce Platform**: Product browsing, cart, wishlist, and checkout
- 👤 **User Authentication**: Secure login and registration with Supabase Auth
- 📦 **Order Management**: Complete order processing with email notifications
- 🎨 **Admin Panel**: Manage products, categories, orders, and homepage content
- 📧 **Email Automation**: Automatic order confirmation and admin notifications
- ✅ **Production Ready**: Error handling, validation, SEO optimization, and health checks
- 🚀 **Deployment Ready**: Configured for Vercel deployment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Inline styles (can be migrated to CSS modules or Tailwind)
- **Notifications**: react-hot-toast
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git (for version control)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd printly
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ADMIN_EMAIL=info@printly.ae
   ```

   See [ENVIRONMENT.md](./ENVIRONMENT.md) for detailed environment variable documentation.

4. **Set up Supabase**

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the database migrations (create tables for products, orders, categories, etc.)
   - Set up storage buckets for product images
   - Configure Row Level Security (RLS) policies

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
printly/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout flow
│   ├── products/          # Product pages
│   ├── wishlist/          # Wishlist page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── error.tsx          # Error page
│   ├── sitemap.ts         # SEO sitemap
│   └── robots.ts          # SEO robots.txt
├── components/            # React components
│   ├── admin/            # Admin components
│   └── ...               # Other components
├── context/              # React context providers
├── lib/                  # Utility functions
│   ├── email.ts         # Email service
│   ├── validation.ts    # Form validation
│   ├── logger.ts        # Logging utility
│   └── supabase*.ts     # Supabase clients
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies
```

## Key Features

### Email Automation

- **Order Confirmation**: Customers receive email confirmation after placing an order
- **Admin Notifications**: Admin receives email notification for new orders
- **Configurable**: Uses Supabase Edge Functions or external email service

See email implementation in `lib/email.ts` and `app/api/orders/notify/route.ts`.

### Error Handling

- **Error Boundaries**: React error boundaries catch component errors
- **Toast Notifications**: User-friendly error messages (no more `alert()`)
- **Error Logging**: Centralized logging for monitoring
- **Error Pages**: Custom error pages for better UX

### Validation

- **Form Validation**: Comprehensive validation for checkout and registration
- **Email Validation**: Email format validation
- **Phone Validation**: UAE phone number format validation
- **Input Sanitization**: XSS protection for user inputs

### SEO Optimization

- **Meta Tags**: Open Graph and Twitter Card tags
- **Sitemap**: Dynamic sitemap generation
- **Robots.txt**: Search engine configuration
- **Structured Data**: Ready for schema.org markup

### Health Checks

- **Health Endpoint**: `/api/health` for monitoring
- **Database Checks**: Verifies Supabase connectivity
- **Email Checks**: Validates email configuration
- **Response Time**: Includes performance metrics

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy!

## Environment Variables

See [ENVIRONMENT.md](./ENVIRONMENT.md) for complete documentation of all environment variables.

## Admin Access

Admin access is controlled by email addresses in `lib/adminEmails.ts`. Add your email to grant admin access.

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/products-api` - Products API
- `GET /api/categories` - Categories API
- `POST /api/orders/notify` - Order notification email endpoint

## Security

- **Row Level Security**: Supabase RLS policies protect data
- **Input Sanitization**: XSS protection
- **Environment Variables**: Sensitive keys stored securely
- **Service Role Key**: Server-side only, never exposed to client

## Monitoring

- Health check endpoint: `/api/health`
- Error logging: Check server logs
- Email notifications: Monitor email delivery

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

See [LICENSE](./LICENSE) file for details.

## Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Check [ENVIRONMENT.md](./ENVIRONMENT.md) for configuration issues
- Review Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

## Roadmap

- [ ] Payment integration
- [ ] Order tracking
- [ ] Product reviews and ratings
- [ ] Advanced search and filters
- [ ] Multi-language support
- [ ] Analytics integration
- [ ] Email templates customization

---

Made with ❤️ for Printly.ae
