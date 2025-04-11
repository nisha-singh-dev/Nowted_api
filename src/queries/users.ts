import pool from '@/lib/db';

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  created_at: string;
}
export async function getAllUsers(): Promise<User[]> {
  const res = await pool.query('SELECT id, name, email, created_at FROM users');
  return res.rows;
}

export async function createUser(user: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const res = await pool.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [user.name, user.email, user.password]
  );
  return res.rows[0];
}
