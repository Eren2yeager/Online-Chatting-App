# 🔍 Upload Debug Guide

## Quick Fixes Applied

### 1. Rate Limiting Fixed ✅
- Added rate limiting to upload API (10 uploads per minute)
- Proper error handling with 429 status code
- Clear error message to users

### 2. File Type Detection Enhanced ✅
- Expanded MIME type support
- Better extension fallback
- Added archive type detection

### 3. Updated Supported MIME Types ✅
- **Images:** Added icon formats
- **Videos:** Added quicktime, x-msvideo, x-matroska
- **Audio:** Added mp4, x-m4a, x-flac, opus
- **Archives:** Added x-zip-compressed, vnd.rar, x-gzip, x-bzip2

---

## How to Test

### 1. Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 2. Open Browser Console
- Press F12
- Go to Console tab
- Clear any old errors

### 3. Try Uploading a File
- Select a file
- Watch the console for errors

---

## Common Issues & Solutions

### Issue: "Rate limit exceeded"
**Cause:** Too many upload attempts  
**Solution:** Wait 1 minute and try again  
**Fix:** Rate limit is now properly implemented

### Issue: "Unsupported file type"
**Cause:** MIME type not in supported list  
**What to do:**
1. Check browser console for the actual MIME type
2. Look for: `file.type = "..."`
3. Tell me the MIME type and I'll add it

### Issue: "Upload failed"
**Cause:** Cloudinary error  
**What to check:**
1. Is Cloudinary configured? (Check .env.local)
2. Are credentials correct?
3. Check server console for detailed error

---

## Debug Steps

### Step 1: Check File MIME Type
Add this to your console when selecting a file:
```javascript
// In browser console after selecting file
console.log('File type:', fileInput.files[0].type);
console.log('File name:', fileInput.files[0].name);
console.log('File size:', fileInput.files[0].size);
```

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Try uploading
3. Click on the `/api/upload` request
4. Check:
   - Status code (should be 200)
   - Response body (look for error messages)
   - Request payload (verify file is being sent)

### Step 3: Check Server Console
Look for these messages:
- ✅ "Cloudinary upload error:" - Shows Cloudinary issues
- ✅ "Upload error:" - Shows general errors
- ✅ Rate limit warnings

---

## What MIME Type is Your File?

If you're getting "unsupported file type", tell me:
1. What type of file? (e.g., "MP3 audio file")
2. The exact error message
3. The MIME type from console (if visible)

I'll add it to the supported types immediately.

---

## Current Supported Types

### Images (9 types)
- image/jpeg, image/jpg, image/png
- image/gif, image/webp, image/svg+xml
- image/bmp, image/x-icon, image/vnd.microsoft.icon

### Videos (8 types)
- video/mp4, video/webm, video/ogg
- video/quicktime, video/x-msvideo
- video/x-matroska, video/x-flv, video/x-ms-wmv

### Audio (11 types)
- audio/mpeg, audio/mp3, audio/wav
- audio/ogg, audio/webm, audio/mp4
- audio/x-m4a, audio/aac, audio/flac
- audio/x-flac, audio/opus

### Documents (14 types)
- application/pdf
- MS Office formats (doc, docx, xls, xlsx, ppt, pptx)
- text/plain, text/csv
- application/json, application/xml, text/xml
- application/rtf, text/rtf

### Archives (10 types)
- application/zip, application/x-zip-compressed
- application/x-rar-compressed, application/x-rar, application/vnd.rar
- application/x-7z-compressed
- application/x-tar
- application/gzip, application/x-gzip
- application/x-bzip2

---

## Quick Test Commands

### Test Rate Limiting
```bash
# In browser console
for(let i = 0; i < 15; i++) {
  console.log(`Upload attempt ${i+1}`);
  // Try uploading - should fail after 10
}
```

### Check Cloudinary Config
```bash
# In your terminal
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
# Don't echo API_SECRET for security
```

---

## Files Modified

1. ✅ `src/app/(protected)/api/upload/route.js`
   - Added rate limiting
   - Enhanced file type detection
   - Better error messages

2. ✅ `src/lib/client/fileSettings.json`
   - Expanded MIME types
   - Added missing formats

---

## Next Steps

1. **Restart dev server** - `npm run dev`
2. **Try uploading** - Test with different file types
3. **Check console** - Look for specific errors
4. **Report back** - Tell me what MIME type is failing

---

## Emergency: Disable Rate Limiting

If rate limiting is causing issues during testing:

Edit `src/app/(protected)/api/upload/route.js`:
```javascript
// Comment out these lines temporarily:
// const rateLimitResult = await rateLimit(request, 10, 60 * 1000);
// if (!rateLimitResult.success) { ... }
```

---

**Status:** Ready for testing  
**Action Required:** Restart server and test upload
