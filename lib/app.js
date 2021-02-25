const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/albums', async (req, res) => {
  try {
    const data = await client.query('SELECT * from albums');

    res.json(data.rows);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.get('/albums/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = await client.query('SELECT * from albums where id=$1', [id]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.delete('/albums/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = await client.query('delete from albums where id=$1 returning *', [id]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.post('/albums', async (req, res) => {
  try {
    const data = await client.query('insert into albums (name, image, description, category, price, is_old, owner_id) values ($1, $2, $3, $4, $5, $6, $7) returning *',
      [
        req.body.name,
        req.body.image,
        req.body.description,
        req.body.category,
        req.body.price,
        req.body.is_old,
        1
      ]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.put('/albums/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const data = await client.query(`
      UPDATE albums
      SET name = $1, image = $2, description = $3, category = $4, price = $5, is_old = $6
      WHERE id=$7
      returning *;
    `,
      [
        req.body.name,
        req.body.image,
        req.body.description,
        req.body.category,
        req.body.price,
        req.body.is_old,
        id,
      ]);

    res.json(data.rows[0]);
  } catch (e) {

    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
