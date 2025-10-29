import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all statistics for reports and dashboard
router.get('/', async (req, res) => {
  try {
    // Perform all queries in parallel for efficiency
    const [
      totalCustomersRes,
      activeCustomersRes,
      openTicketsRes,
      totalRevenueRes,
      totalInteractionsRes,
      statusCountsRes,
      interactionCountsRes,
      monthlyDataRes
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "MARM".customers'),
            // *** CHANGED: Fixed quotes and escaped 'Active' ***
      pool.query('SELECT COUNT(*) FROM "MARM".customers WHERE status = \'Active\''),
            // *** CHANGED: Fixed quotes, table name, and escaped 'Open' ***
      pool.query('SELECT COUNT(*) FROM "MARM".support_tickets WHERE status = \'Open\''),
      pool.query('SELECT SUM(value) FROM "MARM".customers'),
      pool.query('SELECT COUNT(*) FROM "MARM".interactions'),
            // *** CHANGED: Fixed quotes and escaped 'Churned' ***
      pool.query('SELECT status, COUNT(*) FROM "MARM".customers WHERE status != \'Churned\' GROUP BY status'),
      pool.query('SELECT type, COUNT(*) FROM "MARM".interactions GROUP BY type'),
      pool.query(`
        SELECT
          to_char(created_at, 'Mon') as month,
          EXTRACT(YEAR FROM created_at) as year,
          SUM(value) as revenue,
          COUNT(*) as new_customers
        FROM "MARM".customers
        WHERE created_at > NOW() - INTERVAL '6 months'
        GROUP BY year, month
        ORDER BY year, month
      `)
    ]);

    // Process status counts
    const statusCounts = {
      'Active': 0,
      'Inactive': 0,
      'Prospect': 0,
      'Qualified': 0
    };
    statusCountsRes.rows.forEach(row => {
     if (statusCounts.hasOwnProperty(row.status)) {
        statusCounts[row.status] = parseInt(row.count, 10);
      }
    });

    // Process interaction counts
    const interactionCounts = {};
    interactionCountsRes.rows.forEach(row => {
     interactionCounts[row.type] = parseInt(row.count, 10);
    });
    
    // Process monthly data
    const monthlyRevenue = {};
    const monthlyCustomers = {};
    monthlyDataRes.rows.forEach(row => {
      const monthKey = row.month.trim();
      monthlyRevenue[monthKey] = parseFloat(row.revenue);
      monthlyCustomers[monthKey] = parseInt(row.new_customers, 10);
    });

    res.json({
      totalCustomers: parseInt(totalCustomersRes.rows[0].count, 10),
      activeCustomers: parseInt(activeCustomersRes.rows[0].count, 10),
      openTickets: parseInt(openTicketsRes.rows[0].count, 10),
      totalRevenue: parseFloat(totalRevenueRes.rows[0].sum) || 0,
      totalInteractions: parseInt(totalInteractionsRes.rows[0].count, 10),
  statusCounts,
      interactionCounts,
      monthlyRevenue,
      monthlyCustomers
    });

  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
