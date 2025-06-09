var express = require('express');
var router = express.Router();
var db = require('../db'); // Import the database module

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET API: fetch all fish price data */
router.get('/api/prices', function(req, res) {
  db.all('SELECT * FROM fishery_wholesale_prices ORDER BY year ASC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/* GET API: fetch price data for a specific product */
router.get('/api/prices/:productName', function(req, res) {
  const productName = req.params.productName;

  db.all('SELECT * FROM fishery_wholesale_prices WHERE product_name = ? ORDER BY year ASC',
      [productName], (err, rows) => {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
      });
});

/* GET API: get unique product names for dropdown */
router.get('/api/products', function(req, res) {
  db.all('SELECT DISTINCT product_name FROM fishery_wholesale_prices ORDER BY product_name', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows.map(row => row.product_name));
  });
});

module.exports = router;
