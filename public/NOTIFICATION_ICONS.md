# Notification Icons

## Required Icons for Browser Notifications

Place the following icon files in the `/public` directory:

### 1. icon-192.png
- Size: 192x192 pixels
- Format: PNG
- Purpose: Main notification icon
- Used in: Browser notifications

### 2. icon-96.png
- Size: 96x96 pixels
- Format: PNG
- Purpose: Badge icon
- Used in: Browser notification badge

### 3. icon-512.png (Optional)
- Size: 512x512 pixels
- Format: PNG
- Purpose: High-resolution icon
- Used in: PWA manifest

## Creating Icons

You can create these icons from your app logo using:

1. **Online Tools:**
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/

2. **Design Tools:**
   - Figma
   - Adobe Photoshop
   - GIMP (free)

3. **Command Line (ImageMagick):**
   ```bash
   convert logo.png -resize 192x192 icon-192.png
   convert logo.png -resize 96x96 icon-96.png
   convert logo.png -resize 512x512 icon-512.png
   ```

## Fallback

If icons are not available, the browser will use:
- Default browser notification icon
- Or the favicon from your site

## Current Status

- [ ] icon-192.png - Not yet added
- [ ] icon-96.png - Not yet added
- [ ] icon-512.png - Not yet added (optional)

## Note

For now, the notification system will fall back to `/user.jpg` if icons are not available.
