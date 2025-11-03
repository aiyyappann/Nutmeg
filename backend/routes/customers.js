import express from 'express';
import pool from '../db.js';
import format from 'pg-format'; 
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



// POST /api/customers/import
router.post('/import', async (req, res) => {
  try {
    const { customers } = req.body;

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: 'No customer data provided.' });
    }

    const totalToImport = customers.length;

    // Prepare values for insertion
    const values = customers.map(customer => [
      customer.firstName?.trim() || null,
      customer.lastName?.trim() || null,
      customer.email?.trim().toLowerCase() || null,
      customer.phone?.trim() || null,
      customer.company?.trim() || null,
      customer.industry?.trim() || null,
      customer.status?.trim() || 'Prospect',
      customer.value || 0,
      new Date() // last_contact
    ]);

    const query = format(
      `INSERT INTO "MARM".customers 
        (first_name, last_name, email, phone, company, industry, status, value, last_contact)
       VALUES %L
       ON CONFLICT (email) DO NOTHING
       RETURNING id;`,
      values
    );

    const result = await pool.query(query);
    const insertedCount = result.rowCount;
    const skippedCount = totalToImport - insertedCount;

    return res.status(200).json({
      message: 'Import completed successfully',
      inserted: insertedCount,
      skipped: skippedCount,
      total: totalToImport
    });
  } catch (err) {
    console.error('Bulk customer import error:', err);
    return res.status(500).json({
      message: 'Server Error during import',
      error: err.message
    });
  }
});


// GET all customers with pagination, search, and filter
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, search = '', status, industry } = req.query;
    try {
        // *** CHANGED: Added "MARM" schema ***
        let query = 'SELECT *, COUNT(*) OVER() AS total_count FROM "MARM".customers';
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
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;

  // if not a UUID → skip to next route (for example /actions/import)
  if (!uuidRegex.test(id)) return next();

  try {
        const { id } = req.params;
        // *** CHANGED: Added "MARM" schema ***
        const result = await pool.query('SELECT * FROM "MARM".customers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(transformCustomerFromDb(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

//POST (create) a new customer
router.post('/', async (req, res) => {
    const { firstName, lastName, email, phone, company, industry, status, value, address, tags } = req.body;
    try {
        // *** CHANGED: Added "MARM" schema ***
        const result = await pool.query(
            'INSERT INTO "MARM".customers (first_name, last_name, email, phone, company, industry, status, value, address, tags, last_contact) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *',
            [firstName, lastName, email, phone, company, industry, status || 'Prospect', value || 0, address, tags || []]
        );

        const newCustomer = result.rows[0];

        // *** ADDED: Replaces log_new_customer_activity trigger ***
        try {
            const targetName = 'Customer: ' + newCustomer.first_name + ' ' + newCustomer.last_name;
            const details = {
                customer_id: newCustomer.id,
                email: newCustomer.email,
                company: newCustomer.company
            };

            await pool.query(
                'INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                ['created', 'NEWCUSTOMER', targetName, details, newCustomer.id]
            );
        } catch (logErr) {
            // If logging fails, just log the error to the console
            // but don't fail the main customer creation request.
            console.error('Failed to log new customer activity:', logErr);
        }
        // *** END ADDED SECTION ***

        res.status(201).json(transformCustomerFromDb(newCustomer));
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
        // *** CHANGED: Added "MARM" schema ***
        const result = await pool.query(
            'UPDATE "MARM".customers SET first_name = $1, last_name = $2, email = $3, phone = $4, company = $5, industry = $6, status = $7, value = $8, address = $9, tags = $10, last_contact = $11, updated_at = NOW() WHERE id = $12 RETURNING *',
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
        // *** CHANGED: Added "MARM" schema ***
        const result = await pool.query('DELETE FROM "MARM".customers WHERE id = $1', [id]);
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