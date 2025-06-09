const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// Ensure db directory exists
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dbDir, 'sqlite.db');

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');

    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS fishery_wholesale_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,     -- e.g., 牡蠣 (oyster)
        year INTEGER NOT NULL,          -- e.g., 112 (ROC year)
        price_per_kg REAL NOT NULL,     -- e.g., 94.0
        unit TEXT NOT NULL              -- measurement unit, e.g., "元/公斤"
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Fish Price table ready');

            // Import data from FishData.json after table is created
            importFishData();
        }
    });
});

// Function to import fish data from CSV file (only if database is empty)
function importFishData() {
    // First check if the database already has data
    db.get('SELECT COUNT(*) as count FROM fishery_wholesale_prices', (err, row) => {
        if (err) {
            console.error('Error checking database:', err.message);
            return;
        }

        if (row.count > 0) {
            console.log(`Database already has ${row.count} records. Skipping CSV import to preserve existing data.`);
            return;
        }

        console.log('Database is empty. Importing data from CSV file...');
        
        const csvFilePath = path.join(__dirname, '3f22734f46b814a22e7585dc6b1cea99_export.csv');
        const fishData = [];

        // Check if CSV file exists
        if (!fs.existsSync(csvFilePath)) {
            console.error('CSV file not found:', csvFilePath);
            return;
        }

        console.log('Reading CSV file:', csvFilePath);        // Read and parse CSV file
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                // Push each row to the fishData array
                fishData.push({
                    dname1: row.dname1,
                    date: row.date,
                    value: parseFloat(row.value),
                    unit: row.unit
                });
            })
            .on('end', () => {
                console.log(`Found ${fishData.length} records to import`);

                // Begin transaction for better performance
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');

                    const stmt = db.prepare(`INSERT INTO fishery_wholesale_prices 
                        (product_name, year, price_per_kg, unit) VALUES (?, ?, ?, ?)`);

                    // Insert all data
                    fishData.forEach((item) => {
                        stmt.run(
                            item.dname1,
                            parseInt(item.date),
                            item.value,
                            item.unit
                        );
                    });

                    stmt.finalize();

                    db.run('COMMIT', (err) => {
                        if (err) {
                            console.error('Error during commit:', err.message);
                        } else {
                            // Verify the number of records inserted
                            db.get('SELECT COUNT(*) as count FROM fishery_wholesale_prices', (err, row) => {
                                if (err) {
                                    console.error('Error counting records:', err.message);
                                } else {
                                    console.log(`Successfully imported ${row.count} fish price records from CSV`);
                                }
                            });
                        }
                    });
                });
            })
            .on('error', (error) => {
                console.error('Error reading CSV file:', error);
                db.run('ROLLBACK');
            });
    });
}

// Function to reset database (clear all data and reimport from CSV)
function resetDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Resetting database...');
        
        db.run('DELETE FROM fishery_wholesale_prices', (err) => {
            if (err) {
                console.error('Error clearing database:', err.message);
                reject(err);
                return;
            }
            
            console.log('Database cleared. Reimporting data from CSV...');
            
            const csvFilePath = path.join(__dirname, '3f22734f46b814a22e7585dc6b1cea99_export.csv');
            const fishData = [];

            if (!fs.existsSync(csvFilePath)) {
                const error = new Error('CSV file not found: ' + csvFilePath);
                console.error(error.message);
                reject(error);
                return;
            }

            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    fishData.push({
                        dname1: row.dname1,
                        date: row.date,
                        value: parseFloat(row.value),
                        unit: row.unit
                    });
                })
                .on('end', () => {
                    db.serialize(() => {
                        db.run('BEGIN TRANSACTION');

                        const stmt = db.prepare(`INSERT INTO fishery_wholesale_prices 
                            (product_name, year, price_per_kg, unit) VALUES (?, ?, ?, ?)`);

                        fishData.forEach((item) => {
                            stmt.run(
                                item.dname1,
                                parseInt(item.date),
                                item.value,
                                item.unit
                            );
                        });

                        stmt.finalize();

                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('Error during reset commit:', err.message);
                                reject(err);
                            } else {
                                db.get('SELECT COUNT(*) as count FROM fishery_wholesale_prices', (err, row) => {
                                    if (err) {
                                        console.error('Error counting records after reset:', err.message);
                                        reject(err);
                                    } else {
                                        console.log(`Database reset complete. ${row.count} records imported.`);
                                        resolve(row.count);
                                    }
                                });
                            }
                        });
                    });
                })
                .on('error', (error) => {
                    console.error('Error reading CSV during reset:', error);
                    db.run('ROLLBACK');
                    reject(error);
                });
        });
    });
}

// Function to get database statistics
function getDatabaseStats() {
    return new Promise((resolve, reject) => {
        const stats = {};
        
        // Get total record count
        db.get('SELECT COUNT(*) as totalRecords FROM fishery_wholesale_prices', (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            stats.totalRecords = row.totalRecords;
            
            // Get unique product count
            db.get('SELECT COUNT(DISTINCT product_name) as uniqueProducts FROM fishery_wholesale_prices', (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                stats.uniqueProducts = row.uniqueProducts;
                
                // Get year range
                db.get('SELECT MIN(year) as minYear, MAX(year) as maxYear FROM fishery_wholesale_prices', (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    stats.yearRange = {
                        min: row.minYear,
                        max: row.maxYear
                    };
                    
                    resolve(stats);
                });
            });
        });
    });
}

// Handle process termination and close the database connection
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = {
    db,
    resetDatabase,
    getDatabaseStats
};
