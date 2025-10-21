import express from 'express';
import db from '../db.js';

const router = express.Router();

// --- GET All Deal Stages ---
// Fetches the stages for the pipeline view.
router.get('/stages', async (req, res) => {
    try {
        const query = 'SELECT * FROM deal_stages ORDER BY deal_order;';
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching deal stages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- GET All Deals ---
// Fetches all deals and joins with customer data for display.
router.get('/', async (req, res) => {
    try {
        // Join with customers to get the name for each deal card
        const query = `
            SELECT 
                d.*,
                c.first_name,
                c.last_name 
            FROM deals d
            JOIN customers c ON d.customer_id = c.id
            ORDER BY d.created_at DESC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- CREATE a New Deal ---
// Creates a new deal and implicitly logs it via a database trigger.
router.post('/', async (req, res) => {
    const { title, value, customer_id, stage_id, expected_close_date } = req.body;
    try {
        const query = `
            INSERT INTO deals (title, value, customer_id, stage_id, expected_close_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const { rows } = await db.query(query, [title, value, customer_id, stage_id, expected_close_date]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating deal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- UPDATE a Deal's Stage AND Log Activity ---
// This is the key endpoint that now logs the change to the activity feed.
router.put('/:id/stage', async (req, res) => {
    const { id } = req.params;
    const { stage_id: newStageId } = req.body;

    try {
        // Step 1: Get current deal details and old stage name BEFORE updating
        const dealDetailsQuery = `
            SELECT
                d.title,
                d.customer_id,
                ds.name as old_stage_name,
                c.first_name,
                c.last_name
            FROM deals d
            JOIN deal_stages ds ON d.stage_id = ds.id
            JOIN customers c ON d.customer_id = c.id
            WHERE d.id = $1;
        `;
        const dealResult = await db.query(dealDetailsQuery, [id]);

        if (dealResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }
        const { title, customer_id, old_stage_name, first_name, last_name } = dealResult.rows[0];
        const customerName = `${first_name} ${last_name}`;

        // Step 2: Get the new stage name from the database
        const newStageNameQuery = 'SELECT name FROM deal_stages WHERE id = $1;';
        const newStageResult = await db.query(newStageNameQuery, [newStageId]);
        if (newStageResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid new stage ID' });
        }
        const newStageName = newStageResult.rows[0].name;

        // Step 3: Update the deal's stage in the database
        const updateDealQuery = 'UPDATE deals SET stage_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *;';
        const { rows: updatedDeal } = await db.query(updateDealQuery, [newStageId, id]);

        // Step 4: Insert a record into the recent_activities table
        const logActivityQuery = `
            INSERT INTO recent_activities (action, details)
            VALUES ($1, $2);
        `;
        const activityDetails = {
            dealId: id,
            dealTitle: title,
            customerId: customer_id,
            customerName: customerName,
            oldStage: old_stage_name,
            newStage: newStageName
        };
        await db.query(logActivityQuery, ['DEAL_STAGE_CHANGED', activityDetails]);

        res.status(200).json(updatedDeal[0]);

    } catch (error) {
        console.error('Error updating deal stage:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;

