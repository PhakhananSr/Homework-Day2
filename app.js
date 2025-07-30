const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

db.connect((err) => {
  if (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  }
  console.log('Successfully connected to the database');
});



app.get('/', (req, res) => {
  res.send('Hi');
});

//show product
app.get('/products', (req, res) => {
  const query = 'SELECT * FROM products WHERE is_deleted = 0';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

//find product by id
app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM products WHERE id = ? AND is_deleted = 0';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(results[0]);
  });
});

//search product by name keyword
app.get('/products/search/:keyword', (req, res) => {
  const { keyword } = req.params;
  const query = 'SELECT * FROM products WHERE name LIKE ? AND is_deleted = 0';
  db.query(query, [`%${keyword}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

//add product
app.post('/products', (req, res) => {
  const { name, price, discount, review_count, image_url } = req.body;
  db.query(
    'INSERT INTO products (name, price, discount, review_count, image_url) VALUES (?, ?, ?, ?, ?)',
    [name, price, discount, review_count, image_url],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: results.insertId, message: 'Product created' });
    }
  );
});

//edit product
app.put('/products/:id', (req, res) => {
  const { name, price, discount, review_count, image_url } = req.body;
  const { id } = req.params;
  db.query(
    'UPDATE products SET name = ?, price = ?, discount = ?, review_count = ?, image_url = ? WHERE id = ?',
    [name, price, discount, review_count, image_url, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product updated' });
    }
  );
});

/*
//delete product
app.delete('/products/:id', (req, res) => {
  db.query(
    'DELETE FROM products WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product deleted' });
    }
  )
})*/


//soft delete product
app.delete('/products/:id', (req, res) => {
  db.query(
    'UPDATE products SET is_deleted = 1 WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product soft-deleted' });
    }
  )
})

//restore product from soft delete
app.put('/products/restore/:id', (req, res) => {
  db.query(
    'UPDATE products SET is_deleted = 0 WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product restored' });
    }
  );
});



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
