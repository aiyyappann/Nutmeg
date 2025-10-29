import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Helper function to build a WHERE clause from segment rules
const buildWhereClause = (rules) => {
    if (!rules || rules.length === 0) {
        return { clause: '', params: [] };
    }

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    rules.forEach(rule => {
        let condition = '';
        const field = rule.field;
        const operator = rule.operator;
        let value = rule.value;

        if (!field || !operator || value === undefined || value === null || value === '') {
            return; // Skip invalid or empty rules
        }
        
        if (operator === 'contains' && ['status', 'industry'].includes(field)) {
            condition = `"${field}" ILIKE $${paramIndex++}`;
            value = `%${value}%`;
        } else {
            const opMap = { eq: '=', ne: '!=', gt: '>', lt: '<' };
            if (!opMap[operator]) return; // Skip unsupported operators
            condition = `"${field}" ${opMap[operator]} $${paramIndex++}`;
        }
        
        if (field === 'value') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                params.push(numValue);
                conditions.push(condition);
            }
        } else {
            params.push(value);
            conditions.push(condition);
        }
    });

    if (conditions.length === 0) {
        return { clause: '', params: [] };
    }

    return {
        clause: `WHERE ${conditions.join(' AND ')}`,
        params: params,
    };
};


// GET all segments with dynamic customer counts
router.get('/', async (req, res) => {
    try {
        // *** CHANGED: Added "MARM" schema ***
        const segmentsResult = await pool.query('SELECT * FROM "MARM".customer_segments ORDER BY created_at DESC');
        const segments = segmentsResult.rows;

        // For each segment, dynamically calculate the number of customers that match its rules
        const segmentsWithCountPromises = segments.map(async (segment) => {
            const rules = segment.criteria?.rules || [];
            const { clause, params } = buildWhereClause(rules);
            
            // If segment has no valid rules, count is 0
            if (!clause) {
                return { ...segment, rules, count: 0 };
            }

            // Query the customers table to get the real count
            // *** CHANGED: Added "MARM" schema ***
            const countQuery = `SELECT COUNT(*) FROM "MARM".customers ${clause}`;
            const countResult = await pool.query(countQuery, params);
            
            return {
                ...segment,
                rules,
                count: parseInt(countResult.rows[0].count, 10)
            };
        });

        const segmentsWithCount = await Promise.all(segmentsWithCountPromises);
        
        res.json(segmentsWithCount);
    } catch (err) {
        console.error('Segments fetch error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new segment
router.post('/', async (req, res) => {
    const { name, description, criteria } = req.body;
    try {
        // *** CHANGED: Added "MARM" schema ***
        const result = await pool.query(
            'INSERT INTO "MARM".customer_segments (name, description, criteria) VALUES ($1, $2, $3) RETURNING *',
            [name, description, criteria]
        );
        const newSegment = result.rows[0];

        // Calculate the count for the newly created segment
        const rules = newSegment.criteria?.rules || [];
        const { clause, params } = buildWhereClause(rules);
        let count = 0;
        if (clause) {
            // *** CHANGED: Added "MARM" schema ***
             const countResult = await pool.query(`SELECT COUNT(*) FROM "MARM".customers ${clause}`, params);
             count = parseInt(countResult.rows[0].count, 10);
        }

        res.status(201).json({ ...newSegment, rules, count });
    } catch (err) {
        console.error('Segment creation error:', err);
        res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE a segment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // *** CHANGED: Added "MARM" schema ***
        await pool.query('DELETE FROM "MARM".customer_segments WHERE id = $1', [id]);
     res.json({ success: true });
    } catch (err) {
        console.error('Segment deletion error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;