import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; 
import { authOptions } from '@/lib/auth.js';
import cloudinary from '@/lib/cloudinary.js';
import { rateLimit } from '@/lib/rateLimit.js';

export async function POST(request) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, 10, 60 * 1000); // 10 uploads per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many uploads. Please try again later.',
          resetAt: rateLimitResult.resetAt
        },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const typeFromClient = formData.get('type');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get original filename and extension
    const originalFilename = file.name;
    const fileExtension = originalFilename.split('.').pop().toLowerCase();
    const mimeType = file.type || '';

    // Debug logging
    console.log('Upload Debug:', {
      filename: originalFilename,
      mimeType: mimeType,
      extension: fileExtension,
      typeFromClient: typeFromClient,
      fileSize: buffer.length
    });

    // Comprehensive file type detection - ALWAYS detect from file, ignore client
    let type = 'document';
    
    // Images
    if (mimeType.startsWith('image/') || 
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(fileExtension)) {
      type = 'image';
    } 
    // Videos
    else if (mimeType.startsWith('video/') || 
             ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(fileExtension)) {
      type = 'video';
    } 
    // Audio - CHECK THIS FIRST before falling back
    else if (mimeType.startsWith('audio/') || 
             mimeType === 'audio/mpeg' ||
             ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'wma', 'opus', 'webm'].includes(fileExtension)) {
      type = 'audio';
    }
    // Archives
    else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed') ||
             ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(fileExtension)) {
      type = 'archive';
    }
    // Documents - default
    else {
      type = 'document';
    }
    
    console.log('Detected type:', type);

    // Upload to Cloudinary
    let result;
    
    try {
      if (type === 'audio') {
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'video', // Cloudinary uses 'video' for audio files
              folder: 'chatapp/audio',
              use_filename: true,
              unique_filename: true,
              chunk_size: 6000000, // 6MB chunks for large files
              timeout: 120000, // 2 minute timeout
            },
            (error, result) => {
              if (error) {
                console.error('Audio upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(buffer);
        });
      } else if (type === 'video') {
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'chatapp/videos',
              use_filename: true,
              unique_filename: true,
              chunk_size: 6000000, // 6MB chunks for large files
              timeout: 120000, // 2 minute timeout
            },
            (error, result) => {
              if (error) {
                console.error('Video upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(buffer);
        });
      } else if (type === 'document' || type === 'archive') {
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'chatapp/documents',
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
      } else {
        // Default: treat as image
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'chatapp/images',
              use_filename: true,
              unique_filename: true,
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
      }

      return NextResponse.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        type: type,
        size: result.bytes,
        width: result.width,
        height: result.height,
        originalName: originalFilename
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Upload failed',
          message: cloudinaryError.message || 'Failed to upload to Cloudinary'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Upload failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
