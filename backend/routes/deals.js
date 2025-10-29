import express from 'express';
import db from '../db.js';

const router = express.Router();

// --- GET All Deal Stages ---
// Fetches the stages for the pipeline view.
router.get('/stages', async (req, res) => {
    try {
        // *** CHANGED: Added "MARM" schema ***
        const query = 'SELECT * FROM "MARM".deal_stages ORDER BY deal_order;';
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
        // *** CHANGED: Added "MARM" schema ***
        const query = `
            SELECT 
                d.*,
                c.first_name,
                c.last_name 
            FROM "MARM".deals d
            JOIN "MARM".customers c ON d.customer_id = c.id
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
// Creates a new deal and now logs it in the application.
router.post('/', async (req, res) => {
    const { title, value, customer_id, stage_id, expected_close_date } = req.body;
    try {
        // *** CHANGED: Added "MARM" schema ***
        const query = `
            INSERT INTO "MARM".deals (title, value, customer_id, stage_id, expected_close_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const { rows } = await db.query(query, [title, value, customer_id, stage_id, expected_close_date]);
        const newDeal = rows[0];

        // *** ADDED: Replaces log_deal_activity trigger ***
        try {
            // Get customer name for logging
            const customerRes = await db.query(
                "SELECT CONCAT_WS(' ', first_name, last_name) AS name FROM \"MARM\".customers WHERE id = $1",
                [newDeal.customer_id]
            );
            
            const customer_name_var = customerRes.rows[0]?.name || 'Unknown Customer';

            const targetName = 'Deal: ' + newDeal.title;
            const details = {
                deal_id: newDeal.id,
                deal_value: newDeal.value,
                customer_name: customer_name_var
            };

            await db.query(
                'INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
                ['created', 'Application', targetName, details, newDeal.customer_id]
            );
        } catch (logErr) {
            console.error('Failed to log new deal activity:', logErr);
        }
        // *** END ADDED SECTION ***

        res.status(201).json(newDeal);
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
        // *** CHANGED: Added "MARM" schema ***
        const dealDetailsQuery = `
            SELECT
                d.title,
                d.customer_id,
                ds.name as old_stage_name,
                c.first_name,
                c.last_name
            FROM "MARM".deals d
            JOIN "MARM".deal_stages ds ON d.stage_id = ds.id
            JOIN "MARM".customers c ON d.customer_id = c.id
            WHERE d.id = $1;
        `;
        const dealResult = await db.query(dealDetailsQuery, [id]);

        if (dealResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }
        const { title, customer_id, old_stage_name, first_name, last_name } = dealResult.rows[0];
        const customerName = `${first_name} ${last_name}`;

        // Step 2: Get the new stage name from the database
        // *** CHANGED: Added "MARM" schema ***
        const newStageNameQuery = 'SELECT name FROM "MARM".deal_stages WHERE id = $1;';
        const newStageResult = await db.query(newStageNameQuery, [newStageId]);
        if (newStageResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid new stage ID' });
        }
        const newStageName = newStageResult.rows[0].name;

        // Step 3: Update the deal's stage in the database
        // *** CHANGED: Added "MARM" schema ***
        const updateDealQuery = 'UPDATE "MARM".deals SET stage_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *;';
        const { rows: updatedDeal } = await db.query(updateDealQuery, [newStageId, id]);

        // *** MODIFIED: Standardized activity logging to match other triggers ***
        // Step 4: Insert a record into the recent_activities table
        const logActivityQuery = `
            INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW());
        `;
        const activityDetails = {
            deal_id: id,
           deal_title: title,
            customer_name: customerName,
            old_stage: old_stage_name,
            new_stage: newStageName
        };
        const targetName = 'Deal: ' + title;

        await db.query(logActivityQuery, [
            'stage_changed', 
            'Application', 
            targetName, 
            activityDetails, 
            customer_id
        ]);
        // *** END MODIFIED SECTION ***

        res.status(200).json(updatedDeal[0]);

    } catch (error) {
        console.error('Error updating deal stage:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;