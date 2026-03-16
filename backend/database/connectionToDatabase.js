import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected idle client error:', err.message);
});

export const connectToDatabase = async () => {
    try {
        const client = await pool.connect();
        const { rows } = await client.query('SELECT current_database(), version()');
        console.log(`PostgreSQL connected: ${rows[0].current_database}`);
        client.release();
    } catch (error) {
        console.error('Failed to connect to PostgreSQL:', error.message);
        throw error;
    }
};

export const query = (text, params) => pool.query(text, params);

export const withTransaction = async (fn) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export default pool;