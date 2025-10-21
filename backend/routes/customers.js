// export default router;
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Helper to transform DB data to frontend format
const transformCustomerFromDb = (dbCustomer) => {
    if (!dbCustomer) return null;
    return {
        id: dbCustomer.id,
        firstName: dbCustomer.first_name,
        lastName: dbCustomer.last_name,
        email: dbCustomer.email,
        phone: dbCustomer.phone,
        company: dbCustomer.company,
        industry: dbCustomer.industry,
        status: dbCustomer.status,
        value: Number(dbCustomer.value),
        createdAt: dbCustomer.created_at,
        updatedAt: dbCustomer.updated_at,
        lastContact: dbCustomer.last_contact,
        address: dbCustomer.address || { street: '', city: '', state: '', zip: '' },
        tags: dbCustomer.tags || []
    };
};

// GET all customers with pagination, search, and filter
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, search = '', status, industry } = req.query;
    try {
        let query = 'SELECT *, COUNT(*) OVER() AS total_count FROM customers';
        const queryParams = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (search) {
            whereClauses.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR company ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }
        if (status) {
            whereClauses.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        if (industry) {
            whereClauses.push(`industry = $${paramIndex}`);
            queryParams.push(industry);
            paramIndex++;
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limit, (page - 1) * limit);

        const { rows } = await pool.query(query, queryParams);
        const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
        const data = rows.map(({ total_count, ...rest }) => rest);

        res.json({
            data: data.map(transformCustomerFromDb),
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Customer fetch error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET a single customer by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(transformCustomerFromDb(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST (create) a new customer
router.post('/', async (req, res) => {
    const { firstName, lastName, email, phone, company, industry, status, value, address, tags } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO customers (first_name, last_name, email, phone, company, industry, status, value, address, tags, last_contact) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *',
            [firstName, lastName, email, phone, company, industry, status || 'Prospect', value || 0, address, tags || []]
        );
        res.status(201).json(transformCustomerFromDb(result.rows[0]));
    } catch (err) {
        console.error('Customer creation error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT (update) an existing customer
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phone, company, industry, status, value, address, tags, lastContact } = req.body;
    try {
        const result = await pool.query(
            'UPDATE customers SET first_name = $1, last_name = $2, email = $3, phone = $4, company = $5, industry = $6, status = $7, value = $8, address = $9, tags = $10, last_contact = $11, updated_at = NOW() WHERE id = $12 RETURNING *',
            [firstName, lastName, email, phone, company, industry, status, value, address, tags, lastContact, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(transformCustomerFromDb(result.rows[0]));
    } catch (err) {
        console.error('Customer update error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE a customer
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM customers WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Customer deletion error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;


