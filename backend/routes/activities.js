import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
* --- GET ALL Recent Activities ---
* Fetches the last 50 activities from the recent_activities table.
* It uses the standardized 'target' and 'details' columns.
* This is ideal for a global activity feed or dashboard.
*/
router.get('/api/activities', async (req, res) => {
 try {
    // *** CHANGED: Query updated to use "MARM" schema and new logging format ***
  const query = `
   SELECT 
    id, 
    action, 
        target,
    details,
    customer_id,
    created_at,
    -- Extract the customer name from the JSON details
        -- Note: 'created' for 'Customer' target uses the 'target' column itself
    CASE
     WHEN action = 'created' AND target LIKE 'Customer:%' THEN REPLACE(target, 'Customer: ', '')
     ELSE details ->> 'customer_name'
    END AS full_name,
    -- Determine a target type for the frontend to use
    CASE
      WHEN target LIKE 'Customer:%' THEN 'contact'
      WHEN target LIKE 'Interaction:%' THEN 'interaction'
      WHEN target LIKE 'Ticket:%' THEN 'ticket'
            WHEN target LIKE 'Deal:%' THEN 'deal'
      ELSE 'system'
    END AS target_type
   FROM "MARM".recent_activities
   ORDER BY created_at DESC
   LIMIT 50;
  `;
  const { rows } = await db.query(query);
  res.status(200).json(rows);
 } catch (error) {
  console.error('Error fetching all activities:', error);
  res.status(500).json({ error: 'Internal Server Error' });
 }
});


/**
* --- GET User-Specific Recent Activities ---
* Fetches the last 50 activities for a specific customer.
* This now filters by the dedicated 'customer_id' column, which is much faster.
* This is perfect for showing an activity timeline on a customer's detail page.
*/
router.get('/api/customers/:customerId/activities', async (req, res) => {
 const { customerId } = req.params;

 if (!customerId) {
  return res.status(400).json({ error: 'Customer ID is required.' });
 }

 try {
    // *** CHANGED: Query updated to use "MARM" schema and filter on customer_id column ***
  const query = `
   SELECT 
    id, 
    action,
        target,
    details,
    customer_id,
    created_at,
    -- Extract the customer name, similar to the general query
    CASE
     WHEN action = 'created' AND target LIKE 'Customer:%' THEN REPLACE(target, 'Customer: ', '')
     ELSE details ->> 'customer_name'
    END AS full_name,
    -- Determine a target type
    CASE
      WHEN target LIKE 'Customer:%' THEN 'contact'
      WHEN target LIKE 'Interaction:%' THEN 'interaction'
      WHEN target LIKE 'Ticket:%' THEN 'ticket'
            WHEN target LIKE 'Deal:%' THEN 'deal'
      ELSE 'system'
    END AS target_type
   FROM "MARM".recent_activities
   -- Filter by the dedicated customer_id column
   WHERE customer_id = $1
   ORDER BY created_at DESC
  TAKE LIMIT 50;
  `;
  const { rows } = await db.query(query, [customerId]);
  res.status(200).json(rows);
 } catch (error) {
  console.error(`Error fetching activities for customer ${customerId}:`, error);
  res.status(500).json({ error: 'Internal Server Error' });
 }
});

export default router;