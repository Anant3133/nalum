/**
 * Alumni Database Controller
 * Handles PostgreSQL alumni database operations
 * Separate from main MongoDB system
 */

// Get all distinct batches/years from alumni database
exports.getBatches = async (req, res) => {
  try {
    const { pool } = require("../../config/postgres.js");

    const sql = `SELECT DISTINCT passing_year as batch 
                 FROM alumni 
                 WHERE passing_year IS NOT NULL 
                 ORDER BY passing_year DESC`;

    const result = await pool.query(sql);

    res.status(200).json({
      success: true,
      batches: result.rows.map(row => row.batch) || [],
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching batches",
    });
  }
};

// Get alumni by batch with pagination
exports.getAlumniByBatch = async (req, res) => {
  try {
    const { batch } = req.params;
    const { pool } = require("../../config/postgres.js");
    const { limit = 50, offset = 0 } = req.query;

    if (!batch) {
      return res.status(400).json({
        success: false,
        message: "Batch parameter is required",
      });
    }

    const sql = `SELECT full_name as name, roll_no, passing_year as batch, branch 
                 FROM alumni 
                 WHERE passing_year = $1 
                 ORDER BY full_name ASC 
                 LIMIT $2 OFFSET $3`;

    const countSql = `SELECT COUNT(*) as total FROM alumni WHERE passing_year = $1`;

    const [result, countResult] = await Promise.all([
      pool.query(sql, [batch, parseInt(limit), parseInt(offset)]),
      pool.query(countSql, [batch]),
    ]);

    res.status(200).json({
      success: true,
      matches: result.rows || [],
      total: parseInt(countResult.rows[0]?.total || 0),
      limit: parseInt(limit),
      offset: parseInt(offset),
      batch: batch,
    });
  } catch (error) {
    console.error("Error fetching alumni by batch:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching alumni records",
    });
  }
};
