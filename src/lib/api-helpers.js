import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import connectDB from './mongodb';

/**
 * Standard API response helpers
 * These functions ensure consistent response format across all API endpoints
 */

/**
 * Success response (200 OK)
 * @param {any} data - Response data
 * @param {Object} init - Additional options
 * @returns {NextResponse}
 */
export function ok(data, init = {}) {
  return NextResponse.json({ 
    success: true, 
    data, 
    ...('pagination' in init ? { pagination: init.pagination } : {}) 
  }, { status: init.status || 200 });
}

/**
 * Created response (201 Created)
 * @param {any} data - Response data
 * @returns {NextResponse}
 */
export function created(data) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

/**
 * Bad request response (400 Bad Request)
 * @param {string} error - Error message
 * @param {any} details - Error details
 * @returns {NextResponse}
 */
export function badRequest(error, details) {
  return NextResponse.json({ 
    success: false, 
    error, 
    ...(details ? { details } : {}) 
  }, { status: 400 });
}

/**
 * Unauthorized response (401 Unauthorized)
 * @param {string} error - Error message
 * @returns {NextResponse}
 */
export function unauthorized(error = 'Unauthorized') {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

/**
 * Forbidden response (403 Forbidden)
 * @param {string} error - Error message
 * @returns {NextResponse}
 */
export function forbidden(error = 'Forbidden') {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

/**
 * Not found response (404 Not Found)
 * @param {string} error - Error message
 * @returns {NextResponse}
 */
export function notFound(error = 'Not found') {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

/**
 * Server error response (500 Internal Server Error)
 * @param {string} error - Error message
 * @returns {NextResponse}
 */
export function serverError(error = 'Internal server error') {
  return NextResponse.json({ success: false, error }, { status: 500 });
}

/**
 * Too many requests response (429 Too Many Requests)
 * @param {string} error - Error message
 * @returns {NextResponse}
 */
export function tooManyRequests(error = 'Rate limit exceeded') {
  return NextResponse.json({ success: false, error }, { status: 429 });
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { session: null, response: unauthorized() };
  return { session };
}

export async function withDb() {
  await connectDB();
}

export function getPagination(searchParams, defaults = { limit: 50, offset: 0 }) {
  const limit = Math.min(parseInt(searchParams.get('limit')) || defaults.limit, 100);
  const offset = parseInt(searchParams.get('offset')) || defaults.offset;
  return { limit, offset };
}


