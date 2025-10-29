import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Helper function to transform data for the frontend
const transformTicketFromDb = (dbTicket) => {
    if (!dbTicket) return null;
    return {
        id: dbTicket.id,
        ticket_number: dbTicket.ticket_number,
        customerId: dbTicket.customer_id,
        customerName: `${dbTicket.first_name} ${dbTicket.last_name}`,
        customerCompany: dbTicket.company,
        title: dbTicket.title,
        description: dbTicket.description,
        priority: dbTicket.priority,
        status: dbTicket.status,
        category: dbTicket.category,
        assignedTo: dbTicket.assigned_to,
        createdAt: dbTicket.created_at,
        updatedAt: dbTicket.updated_at
    };
};

// GET all tickets with filtering and pagination
router.get('/tickets', async (req, res) => {
    // Destructure customerId from the query parameters
    const { page = 1, limit = 10, status, priority, category, customerId } = req.query;
    try {
        // *** CHANGED: Added "MARM" schema ***
        let query = `
            SELECT t.*, c.first_name, c.last_name, c.company, COUNT(*) OVER() AS total_count
            FROM "MARM".support_tickets t
            JOIN "MARM".customers c ON t.customer_id = c.id
        `;
        const queryParams = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (status) {
            whereClauses.push(`t.status = $${paramIndex++}`);
            queryParams.push(status);
        }
        if (priority) {
            whereClauses.push(`t.priority = $${paramIndex++}`);
            queryParams.push(priority);
        }
        if (category) {
            whereClauses.push(`t.category = $${paramIndex++}`);
            queryParams.push(category);
        }
        // Add the customerId filter if it's provided
        if (customerId) {
            whereClauses.push(`t.customer_id = $${paramIndex++}`);
            queryParams.push(customerId);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        
        query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limit, (page - 1) * limit);

        const { rows } = await pool.query(query, queryParams);
        const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
        const data = rows.map(({ total_count, ...rest }) => rest);

        res.json({
            data: data.map(transformTicketFromDb),
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Tickets fetch error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET a single ticket by ID with its responses
router.get('/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // *** CHANGED: Added "MARM" schema ***
        const ticketRes = await pool.query('SELECT t.*, c.first_name, c.last_name, c.company FROM "MARM".support_tickets t JOIN "MARM".customers c ON t.customer_id = c.id WHERE t.id = $1', [id]);
        
        if (ticketRes.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        // *** CHANGED: Added "MARM" schema ***
        const responsesRes = await pool.query('SELECT * FROM "MARM".ticket_responses WHERE ticket_id = $1 ORDER BY created_at ASC', [id]);
        
        const ticket = transformTicketFromDb(ticketRes.rows[0]);
        ticket.responses = responsesRes.rows;

        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new ticket
router.post('/tickets', async (req, res) => {
    const { title, description, customerId, category, priority, assignedTo } = req.body;
    try {
        // *** CHANGED: Added "MARM" schema ***
        const result = await pool.query(
            'INSERT INTO "MARM".support_tickets (title, description, customer_id, category, priority, assigned_to) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, customerId, category, priority, assignedTo]
        );
        // Note: The response here will NOT have customer name, as the original query doesn't join.
        // This matches the original code's behavior.
        res.status(201).json(result.rows[0]); // Original code did not transform, this is an assumption. Let's fix.
        // res.status(201).json(transformTicketFromDb(result.rows[0])); // This would fail.
        
        // Let's do this properly and match the GET single ticket route
        const finalTicketRes = await pool.query(
            'SELECT t.*, c.first_name, c.last_name, c.company FROM "MARM".support_tickets t JOIN "MARM".customers c ON t.customer_id = c.id WHERE t.id = $1',
            [result.rows[0].id]
        );
        res.status(201).json(transformTicketFromDb(finalTicketRes.rows[0]));

    } catch (err) {
        console.error('Ticket creation error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// *** ENTIRE ROUTE MODIFIED TO REPLACE TRIGGER ***
// PUT (update) a ticket's status or other details
router.put('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Can be expanded to update other fields
    
    try {
        // Step 1: Get the ticket *before* updating to check its old status
        const oldTicketRes = await pool.query(
            'SELECT * FROM "MARM".support_tickets WHERE id = $1',
            [id]
        );

        if (oldTicketRes.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        const oldTicket = oldTicketRes.rows[0];
        const oldStatus = oldTicket.status;

        // Step 2: Perform the update
        const updateResult = await pool.query(
            'UPDATE "MARM".support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        const newTicket = updateResult.rows[0];
        const newStatus = newTicket.status;

        // Step 3: Check if status changed and log activity (replaces trigger)
        if (oldStatus !== newStatus) {
            try {
                // Get customer name for logging
                const customerRes = await pool.query(
                    'SELECT first_name, last_name FROM "MARM".customers WHERE id = $1',
                    [newTicket.customer_id]
                );

                let customer_name_var = 'Unknown Customer';
                if (customerRes.rows.length > 0) {
                    customer_name_var = customerRes.rows[0].first_name + ' ' + customerRes.rows[0].last_name;
                }

                const targetName = 'Ticket: ' + newTicket.title;
                const details = {
                    ticket_id: newTicket.id,
                    ticket_number: newTicket.ticket_number,
                    old_status: oldStatus,
                    new_status: newStatus,
                    customer_name: customer_name_var
                };

                await pool.query(
                    'INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                    ['status_changed', 'TICKETSTATUSCHANGED', targetName, details, newTicket.customer_id]
                );

            } catch (logErr) {
                console.error('Failed to log ticket status change:', logErr);
            }
        }

        // Step 4: Get the full, joined data to send a correct response
        // (This fixes the original code which would have sent incomplete data to transformTicketFromDb)
        const finalTicketRes = await pool.query(
             'SELECT t.*, c.first_name, c.last_name, c.company FROM "MARM".support_tickets t JOIN "MARM".customers c ON t.customer_id = c.id WHERE t.id = $1',
             [id]
        );

        res.json(transformTicketFromDb(finalTicketRes.rows[0]));
    } catch (err) {
        console.error('Ticket update error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});
// *** END MODIFIED ROUTE ***

// POST a new response to a ticket
router.post('/tickets/:ticketId/responses', async (req, res) => {
    const { ticketId } = req.params;
    const { author, message } = req.body;
    try {
        // *** CHANGED: Added "MARM" schema ***
        const result = await pool.query(
            'INSERT INTO "MARM".ticket_responses (ticket_id, author, message) VALUES ($1, $2, $3) RETURNING *',
            [ticketId, author, message]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ticket response creation error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;





