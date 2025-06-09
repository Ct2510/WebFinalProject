const express = require('express');
const cors = require('cors');
const { db } = require('./db');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Default route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 查詢 API（可用 /api/prices?region=全台&type=產地價&date=2024-05-23）
app.get('/api/prices', (req, res) => {
    let sql = 'SELECT * FROM prices WHERE 1=1';
    let params = [];
    if (req.query.region) {
        sql += ' AND region = ?';
        params.push(req.query.region);
    }
    if (req.query.type) {
        sql += ' AND type = ?';
        params.push(req.query.type);
    }
    if (req.query.date) {
        sql += ' AND date = ?';
        params.push(req.query.date);
    }

    console.log('Executing SQL:', sql, 'with params:', params);

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error executing query:', err.message);
            res.status(500).json({ error: 'Database query error' });
        } else {
            console.log('Query result:', rows);
            res.json(rows);
        }
    });
});

// 手動新增一筆價格（非必要，主要給你測試用）
app.post('/api/prices', (req, res) => {
    const { date, region, type, price } = req.body;
    if (!date || !region || !type || !price) {
        return res.status(400).json({ error: '缺少欄位' });
    }
    db.run(
        `INSERT INTO prices (date, region, type, price) VALUES (?, ?, ?, ?)`,
        [date, region, type, price],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// API to get all unique product names
app.get('/api/products', (req, res) => {
    db.all('SELECT DISTINCT product_name FROM fishery_wholesale_prices ORDER BY product_name', [], (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err.message);
            res.status(500).json({ error: 'Database query error' });
        } else {
            console.log('Products:', rows);
            res.json(rows);
        }
    });
});

// API to get years for a specific product
app.get('/api/years/:product', (req, res) => {
    const productName = req.params.product;
    // Get distinct years directly (ROC years like 102, 103, etc.)
    db.all(`SELECT DISTINCT year 
            FROM fishery_wholesale_prices 
            WHERE product_name = ? 
            ORDER BY year`, [productName], (err, rows) => {
        if (err) {
            console.error('Error fetching years:', err.message);
            res.status(500).json({ error: 'Database query error' });
        } else {
            console.log('Years for', productName, ':', rows);
            res.json(rows);
        }
    });
});

// API to get price data for a specific product within a year range
app.get('/api/prices/:product', (req, res) => {
    const productName = req.params.product;
    const startYear = req.query.startYear;
    const endYear = req.query.endYear;
    
    let sql = `SELECT *, year as display_year 
               FROM fishery_wholesale_prices 
               WHERE product_name = ?`;
    let params = [productName];
    
    if (startYear && endYear) {
        sql += ' AND year >= ? AND year <= ?';
        params.push(parseInt(startYear), parseInt(endYear));
    }
    
    sql += ' ORDER BY year';
    
    console.log('Executing SQL:', sql, 'with params:', params);
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching price data:', err.message);
            res.status(500).json({ error: 'Database query error' });
        } else {
            console.log('Price data result:', rows);
            res.json(rows);
        }
    });
});

// API to add new fish price data
app.post('/api/fish-prices', (req, res) => {
    const { product_name, year, price_per_kg, unit } = req.body;
    
    // Validate required fields
    if (!product_name || !year || !price_per_kg || !unit) {
        return res.status(400).json({ 
            error: '所有欄位都是必填的 (product_name, year, price_per_kg, unit)' 
        });
    }
    
    // Validate data types
    const yearInt = parseInt(year);
    const priceFloat = parseFloat(price_per_kg);
    
    if (isNaN(yearInt) || isNaN(priceFloat)) {
        return res.status(400).json({ 
            error: '年份必須是整數，價格必須是數字' 
        });
    }
    
    console.log('Adding new fish price data:', { product_name, year: yearInt, price_per_kg: priceFloat, unit });
    
    // Check if record already exists
    db.get(
        'SELECT id FROM fishery_wholesale_prices WHERE product_name = ? AND year = ?',
        [product_name, yearInt],
        (err, existingRecord) => {
            if (err) {
                console.error('Error checking existing record:', err.message);
                return res.status(500).json({ error: '資料庫查詢錯誤' });
            }
            
            if (existingRecord) {
                // Update existing record
                db.run(
                    'UPDATE fishery_wholesale_prices SET price_per_kg = ?, unit = ? WHERE product_name = ? AND year = ?',
                    [priceFloat, unit, product_name, yearInt],
                    function(err) {
                        if (err) {
                            console.error('Error updating fish price:', err.message);
                            return res.status(500).json({ error: '更新資料失敗' });
                        }
                        console.log('Updated fish price record, changes:', this.changes);
                        res.json({ 
                            message: '資料更新成功',
                            id: existingRecord.id,
                            changes: this.changes
                        });
                    }
                );
            } else {
                // Insert new record
                db.run(
                    'INSERT INTO fishery_wholesale_prices (product_name, year, price_per_kg, unit) VALUES (?, ?, ?, ?)',
                    [product_name, yearInt, priceFloat, unit],
                    function(err) {
                        if (err) {
                            console.error('Error adding fish price:', err.message);
                            return res.status(500).json({ error: '新增資料失敗' });
                        }
                        console.log('Added new fish price record, ID:', this.lastID);
                        res.json({ 
                            message: '資料新增成功',
                            id: this.lastID
                        });
                    }
                );
            }
        }
    );
});

// Debug route to log and return all rows from the fishery_wholesale_prices table
app.get('/api/debug/prices', (req, res) => {
    db.all('SELECT * FROM fishery_wholesale_prices LIMIT 10', [], (err, rows) => {
        if (err) {
            console.error('Error fetching all prices:', err.message);
            res.status(500).json({ error: 'Database query error' });
        } else {
            console.log('Sample prices:', rows);
            res.json(rows);
        }
    });
});

// Debug route to check the existence and schema of the fishery_wholesale_prices table
app.get('/api/debug/schema', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='fishery_wholesale_prices'", [], (err, rows) => {
        if (err) {
            console.error('Error fetching table schema:', err.message);
            res.status(500).json({ error: 'Database schema query error' });
        } else if (rows.length === 0) {
            console.error('Table `fishery_wholesale_prices` does not exist');
            res.status(404).json({ error: 'Table `fishery_wholesale_prices` does not exist' });
        } else {
            db.all("PRAGMA table_info(fishery_wholesale_prices)", [], (err, schema) => {
                if (err) {
                    console.error('Error fetching table info:', err.message);
                    res.status(500).json({ error: 'Database schema info error' });
                } else {
                    console.log('Table schema:', schema);
                    res.json(schema);
                }
            });
        }
    });
});

module.exports = app;
