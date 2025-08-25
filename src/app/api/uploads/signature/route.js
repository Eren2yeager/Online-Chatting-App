import { getServerSession } from 'next-auth';
// import { authOptions } from '../../../lib/auth';
// import { generateSignedUploadParams } from '../../../lib/cloudinary';
// import { validateQuery, uploadSignatureSchema } from '../../../lib/validators';
// import { rateLimit } from '../../../lib/rateLimit';

/**
 * GET /api/uploads/signature
 * Generate signed upload parameters for Cloudinary
 * Allows secure client-side uploads without exposing API secret
 */
export async function GET(request) {
  try {
    // Check authentication
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return Response.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Apply rate limiting
    // const rateLimitResult = await rateLimit(request, 10, 60 * 1000); // 10 requests per minute
    // if (!rateLimitResult.success) {
    //   return Response.json(
    //     { success: false, error: 'Rate limit exceeded' },
    //     { status: 429 }
    //   );
    // }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // try {
    //   await uploadSignatureSchema.parseAsync(query);
    // } catch (error) {
    //   return Response.json(
    //     { success: false, error: 'Invalid query parameters', details: error.errors },
    //     { status: 400 }
    //   );
    // }

    const { folder = 'chat-app', publicId } = query;

    // Generate signed upload parameters
    // const uploadParams = generateSignedUploadParams(folder, publicId);

    return Response.json({
      success: true,
      data: { folder, publicId },
    });

  } catch (error) {
    console.error('Error generating upload signature:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
