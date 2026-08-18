import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/contributions – all contributions joined with user name
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        u.name        AS user_name,
        c.category,
        c.description,
        c.time_estimate,
        c.status,
        c.source,
        c.created_at
      FROM contributions c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/contributions error:', err);
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }
}

// POST /api/contributions – insert a new contribution
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, category, description, time_estimate } = body;

    // Validate required fields
    if (!user_id || !category || !description || time_estimate == null) {
      return NextResponse.json(
        { error: 'user_id, category, description, and time_estimate are required.' },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO contributions (user_id, category, description, time_estimate)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, category, description, time_estimate]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/contributions error:', err);
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
  }
}
