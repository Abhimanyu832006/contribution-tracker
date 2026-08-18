import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/users – return all users
export async function GET() {
  try {
    const { rows } = await pool.query('SELECT id, name FROM users ORDER BY name ASC');
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
