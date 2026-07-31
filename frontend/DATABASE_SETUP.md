# Database Setup Instructions

## Overview
Your Honey Translation Services e-commerce site now uses **Supabase** for real authentication and database persistence. This document explains how to set up your database.

## Database Schema

Your application uses the following database tables:

### 1. **user_profiles**
Stores user account information and roles.

```sql
- id (UUID, Primary Key) - Links to auth.users
- email (TEXT, Unique, Not Null)
- name (TEXT, Not Null)
- role (TEXT, Not Null) - Either 'admin' or 'customer'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. **products**
Stores all product information (translations, apostilles, attestations, packages).

```sql
- id (UUID, Primary Key, Auto-generated)
- name (TEXT, Not Null)
- category (TEXT, Not Null)
- price (NUMERIC, Not Null)
- old_price (NUMERIC, Optional)
- stock (INTEGER, Not Null)
- status (TEXT, Not Null) - Either 'active' or 'inactive'
- image_url (TEXT)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. **orders**
Stores all customer orders.

```sql
- id (UUID, Primary Key, Auto-generated)
- user_id (UUID, Foreign Key to user_profiles)
- order_number (TEXT, Unique, Not Null)
- items (JSONB, Not Null) - Array of order items
- total_amount (NUMERIC, Not Null)
- status (TEXT, Not Null) - 'pending', 'processing', 'completed', 'cancelled'
- payment_status (TEXT, Not Null) - 'pending', 'paid', 'failed'
- payment_method (TEXT, Not Null) - Default 'cod'
- shipping_address (JSONB, Not Null)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Setup Instructions

### Step 1: Run the SQL Script

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `/supabase/functions/server/init-database.sql`
5. Click **Run** to execute the script

This will:
- Create all necessary tables
- Set up indexes for better performance
- Enable Row Level Security (RLS)
- Create security policies
- Insert 13 sample products

### Step 2: Create Your First Admin User

After running the SQL script, you need to create an admin user:

1. Go to the **Sign Up** page (`/signup`)
2. Create your account with:
   - Your email
   - A secure password
   - Your name
3. After signup, open the Supabase Dashboard
4. Go to **Table Editor** → **user_profiles**
5. Find your newly created user
6. Change the `role` from `'customer'` to `'admin'`
7. Save changes

Now you can sign in and access the Admin Dashboard!

## Row Level Security (RLS) Policies

The database is secured with the following policies:

### user_profiles
- Users can view and update their own profile
- No direct inserts (handled by signup endpoint)

### products
- Everyone can view active products
- Admins can view all products (including inactive)
- Only admins can create, update, or delete products

### orders
- Users can view their own orders
- Admins can view all orders
- Users can create orders for themselves
- Only admins can update order status

## API Endpoints

Your backend server provides these endpoints:

### Authentication
- `POST /make-server-a67f0635/auth/signup` - Create new user account
- `GET /make-server-a67f0635/auth/me` - Get current user profile

### Products (Admin Only - except GET)
- `GET /make-server-a67f0635/products` - List all products
- `GET /make-server-a67f0635/products/:id` - Get single product
- `POST /make-server-a67f0635/products` - Create product
- `PUT /make-server-a67f0635/products/:id` - Update product
- `DELETE /make-server-a67f0635/products/:id` - Delete product

### Orders
- `GET /make-server-a67f0635/orders` - Get all orders (Admin only)
- `GET /make-server-a67f0635/orders/my-orders` - Get user's orders
- `GET /make-server-a67f0635/orders/:id` - Get single order
- `POST /make-server-a67f0635/orders` - Create new order
- `PATCH /make-server-a67f0635/orders/:id/status` - Update order status (Admin only)

### Admin
- `GET /make-server-a67f0635/admin/stats` - Get dashboard statistics (Admin only)

## Sample Products

The init script includes 13 sample products:
- 4 Translation services
- 3 Apostille services
- 3 Attestation services
- 3 Startup packages

## Features

✅ **Real User Authentication** - Powered by Supabase Auth
✅ **Secure Password Storage** - Hashed and encrypted
✅ **Role-Based Access** - Admin and Customer roles
✅ **Persistent Database** - All data stored in PostgreSQL
✅ **Order Management** - Complete order tracking system
✅ **Inventory Management** - Full CRUD operations for products
✅ **Security Policies** - Row Level Security (RLS) enabled
✅ **Admin Dashboard** - Real-time statistics and management

## Next Steps

1. Run the SQL script in Supabase
2. Create your admin account
3. Sign in and explore the Admin Dashboard
4. Start managing products and orders!

## Troubleshooting

**Can't access Admin Dashboard?**
- Make sure you've changed your `role` to `'admin'` in the `user_profiles` table

**Products not showing?**
- Check that `status` is set to `'active'` in the products table
- Run the init script again if sample products are missing

**Authentication errors?**
- Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- Verify the Auth service is enabled in your Supabase project

## Security Notes

⚠️ **Important:**
- Never expose your `SUPABASE_SERVICE_ROLE_KEY` in the frontend
- The key is only used in the backend server
- All API calls require authentication tokens
- RLS policies provide additional security at the database level
