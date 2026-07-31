# Customer Queries Testing Guide

## Overview
The Customer Query feature allows customers to submit inquiries through a modal form accessible from the website header. All submissions are stored in the backend and displayed in the Admin Panel for management.

## How It Works

### 1. **Customer Submission Flow**
- Customer clicks the orange **"Query"** button in the website header
- A modal opens with a form requesting:
  - Name (required)
  - Mobile Number (required)
  - Email Address (optional)
  - Message (required)
- Upon submission, the query is saved to the backend KV store
- A notification is created for the admin

### 2. **Admin Panel Management**
- Navigate to **Admin Panel > Customer Queries**
- View all submitted queries in a table format with:
  - Customer Info (Name, ID)
  - Contact Details (Mobile, Email)
  - Message (with expand/collapse)
  - Submitted Date
  - Status (Pending/Contacted/Resolved)
  - Actions (Delete)

## Testing Steps

### **Step 1: Submit a Test Query**
1. Open the main website (not admin panel)
2. Look for the orange **"Query"** button in the top header (next to phone number)
3. Click the button to open the query modal
4. Fill in the form:
   - **Name**: Test Customer
   - **Mobile**: +91 9876543210
   - **Email**: test@example.com (optional)
   - **Message**: This is a test query to verify the system is working correctly.
5. Click **"Send Query"**
6. You should see a success message: "Your query has been submitted successfully! We will contact you soon."

### **Step 2: Verify in Admin Panel**
1. Navigate to **Admin Panel** (login with admin@honeytranslations.com / admin123)
2. Click **"Customer Queries"** in the sidebar
3. The query you just submitted should appear in the table
4. Verify all details are displayed correctly:
   - Name, mobile, email, message
   - Submitted date
   - Status shows "Pending"

### **Step 3: Test Admin Actions**
1. **Expand Query**: Click on a query row to see full message details
2. **Update Status**: Change status from "Pending" to "Contacted" or "Resolved"
3. **Delete Query**: Click the delete icon (requires double-click confirmation)
4. **Refresh**: Click "Refresh" button to reload queries
5. **Export**: Click "Export CSV" to download all queries

## Features

### **Auto-Refresh**
- The Customer Queries page automatically refreshes every 30 seconds
- This ensures new queries appear without manual refresh

### **Statistics Cards**
- **Total Queries**: Shows all submitted queries
- **Pending Queries**: Filters to show only pending queries
- **This Month**: Filters to show queries from current month

### **Console Logging**
All query submissions log detailed information in the browser console:

**Frontend (QueryModal):**
```
📤 Submitting customer query: { name, mobile, email, message }
✅ Query submitted successfully: { queryId }
📊 Query ID: query_1234567890_abc123
👉 Check Admin Panel > Customer Queries to see this submission
```

**Backend (Supabase Edge Function):**
```
💬 Customer query endpoint called
📋 Query submission details: { name, mobile, email, messageLength }
✅ Customer query saved successfully!
   📊 Query ID: query_1234567890_abc123
   👤 Customer: John Doe (+91 9876543210)
   💾 Storage Key: customer_query_query_1234567890_abc123
🔔 Notification created for admin: notif_1234567890_xyz789
```

## Data Storage

### **KV Store Keys**
- **Queries**: `customer_query_query_1234567890_abc123`
- **Notifications**: `notification_notif_1234567890_xyz789`

### **Query Object Structure**
```json
{
  "id": "query_1234567890_abc123",
  "name": "John Doe",
  "mobile": "+91 9876543210",
  "email": "john@example.com",
  "message": "I need help with document translation...",
  "submittedAt": "2026-03-10T10:30:00.000Z",
  "status": "pending"
}
```

## Troubleshooting

### **Query not appearing in Admin Panel**
1. Check browser console for error messages
2. Verify backend is deployed and running
3. Click "Refresh" button in admin panel
4. Check that form was submitted successfully (look for success toast)

### **"Failed to submit query" error**
1. Check network tab for API call errors
2. Verify backend endpoint is accessible
3. Check console logs for detailed error messages
4. Ensure name and mobile fields are filled (required)

### **Empty state in Admin Panel**
- If no queries have been submitted yet, you'll see an informational banner
- The banner explains how to submit a test query
- Statistics will show "0" for all categories

## API Endpoints

### **Submit Query** (Public)
- **POST** `/make-server-a67f0635/customer-queries`
- **Body**: `{ name, mobile, email?, message }`
- **Response**: `{ success: true, queryId: "query_..." }`

### **Get All Queries** (Admin)
- **GET** `/make-server-a67f0635/admin/customer-queries`
- **Response**: `{ success: true, queries: [...] }`

### **Delete Query** (Admin)
- **DELETE** `/make-server-a67f0635/admin/customer-queries/:id`
- **Response**: `{ success: true, message: "..." }`

### **Update Status** (Admin)
- **PATCH** `/make-server-a67f0635/admin/customer-queries/:id/status`
- **Body**: `{ status: "pending" | "contacted" | "resolved" }`
- **Response**: `{ success: true, query: {...} }`

## Success Indicators

✅ **Query submission successful** when you see:
- Success toast notification
- Console logs showing query ID
- Modal closes automatically after 1.5 seconds

✅ **Query visible in admin panel** when you see:
- Query appears in table with all details
- Statistics counters increment
- Status shows "Pending"
- Can expand to view full message

✅ **Full system working** when:
- Submit query from main site → appears in admin panel
- Update status → changes reflected immediately
- Delete query → removes from list
- Export CSV → downloads file with all queries

---

**Last Updated**: March 10, 2026
