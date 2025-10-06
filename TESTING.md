# Testing Guide - Document Upload System

## Prerequisites

1. **Supabase Setup Complete**
   - Database schema executed
   - Storage bucket `documents` created
   - Storage policies applied
   - Email auth enabled

2. **Environment Variables Set**
   - `.env.local` configured with Supabase credentials

## Test Flow

### 1. Start Development Server

```bash
pnpm dev
```

Open http://localhost:3000

### 2. Create Test Account

1. Navigate to `/login`
2. Click "Don't have an account? Sign up"
3. Enter test email and password (min 6 characters)
4. Check email for confirmation link
5. Click confirmation link
6. Sign in with credentials

### 3. Test Document Upload

1. After login, navigate to "Records" in sidebar
2. Click "Upload" tab
3. Select document type from dropdown
4. Drag and drop files OR click to browse
   - Supported: PDF, Images, Word docs
5. Click "Upload" or "Upload All"
6. Verify upload progress
7. Check for success indicator

### 4. Test Document List

1. Switch to "All Documents" tab
2. Verify uploaded documents appear
3. Check document metadata:
   - File name
   - Type badge
   - File size
   - Upload date
4. Test delete functionality:
   - Click trash icon
   - Confirm deletion
   - Verify document removed

### 5. Verify Database

In Supabase Dashboard:
1. Go to Table Editor
2. Check `documents` table
3. Verify records exist with correct user_id

### 6. Verify Storage

In Supabase Dashboard:
1. Go to Storage → documents bucket
2. Navigate to your user_id folder
3. Verify files uploaded

## Expected Results

- Documents upload successfully
- Files stored in Supabase Storage
- Database records created
- Documents listed correctly
- Delete function works
- No console errors

## Common Issues

### 1. Upload Fails with 401
- Check Supabase credentials in `.env.local`
- Verify user is authenticated

### 2. Upload Fails with 500
- Check storage bucket exists
- Verify storage policies applied
- Check console for detailed error

### 3. Documents Not Listing
- Verify database table exists
- Check RLS policies
- Confirm user_id matches

### 4. Can't Delete Documents
- Verify storage policies allow delete
- Check database RLS policies

## Next Steps After Testing

1. Add PDF viewer component
2. Implement OCR processing
3. Add document classification
4. Build patient association
5. Create case management

