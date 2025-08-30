import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import connectDB from './mongodb';

export function ok(data, init = {}) {
  return NextResponse.json({ success: true, data, ...('pagination' in init ? { pagination: init.pagination } : {}) }, { status: init.status || 200 });
}

export function created(data) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function badRequest(error, details) {
  return NextResponse.json({ success: false, error, ...(details ? { details } : {}) }, { status: 400 });
}

export function unauthorized(error = 'Unauthorized') {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

export function notFound(error = 'Not found') {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

export function serverError(error = 'Internal server error') {
  return NextResponse.json({ success: false, error }, { status: 500 });
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


