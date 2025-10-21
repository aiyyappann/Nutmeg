// import pkg from 'pg';
// import dotenv from 'dotenv';

// dotenv.config();

// const { Pool } = pkg;

// // Configure and export the PostgreSQL connection pool
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: parseInt(process.env.DB_PORT || '5432', 10),
// });

// export default pool;

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Configure and export the PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  options: '-c search_path=MARM',
});

export default pool;