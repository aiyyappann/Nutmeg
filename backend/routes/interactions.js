import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Helper function
const transformInteractionFromDb = (dbInteraction) => {
    return {
        id: dbInteraction.id,
        customerId: dbInteraction.customer_id,
        customerName: `${dbInteraction.first_name} ${dbInteraction.last_name}`,
        customerCompany: dbInteraction.company,
        type: dbInteraction.type,
        channel: dbInteraction.channel,
        subject: dbInteraction.subject,
        notes: dbInteraction.notes,
        date: dbInteraction.date,
        duration: dbInteraction.duration,
        outcome: dbInteraction.outcome,
        nextAction: dbInteraction.next_action,
        createdAt: dbInteraction.created_at
    };
};

// GET all interactions
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, customerId } = req.query;
    try {
        let query = `
            SELECT i.*, c.first_name, c.last_name, c.company, COUNT(*) OVER() AS total_count
            FROM interactions i
            JOIN customers c ON i.customer_id = c.id
        `;
        const queryParams = [];
        if (customerId) {
            query += ' WHERE i.customer_id = $1';
            queryParams.push(customerId);
        }
        query += ` ORDER BY i.date DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, (page - 1) * limit);

        const { rows } = await pool.query(query, queryParams);
        const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
        const data = rows.map(({ total_count, ...rest }) => rest);

        res.json({
            data: data.map(transformInteractionFromDb),
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Interactions fetch error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new interaction
router.post('/', async (req, res) => {
    const { customerId, type, channel, subject, notes, duration, outcome, nextAction } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO interactions (customer_id, type, channel, subject, notes, duration, outcome, next_action) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [customerId, type, channel, subject, notes, duration, outcome, nextAction]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Interaction creation error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT (update) an existing interaction
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { customerId, type, channel, subject, notes, duration, outcome, nextAction } = req.body;
    try {
        const result = await pool.query(
            'UPDATE interactions SET customer_id = $1, type = $2, channel = $3, subject = $4, notes = $5, duration = $6, outcome = $7, next_action = $8, updated_at = NOW() WHERE id = $9 RETURNING *',
            [customerId, type, channel, subject, notes, duration, outcome, nextAction, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Interaction not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Interaction update error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE an interaction
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM interactions WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Interaction not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Interaction deletion error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});


export default router;


