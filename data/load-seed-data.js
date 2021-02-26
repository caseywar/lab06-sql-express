const client = require('../lib/client');
// import our seed data:
const albums = require('./albums.js');
const usersData = require('./users.js');
const categoriesData = require('./categories.js');
const { getEmoji } = require('../lib/emoji.js');
const { getCategoryId } = require('./dataUtils.js');


run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
          [user.email, user.hash]);
      })
    );

    const user = users[0].rows[0];

    const responses = await Promise.all(
      categoriesData.map(category => {
        return client.query(`
                      INSERT INTO categories (name)
                      VALUES ($1)
                      RETURNING *;
                  `,
          [category.name]);
      })
    );

    const categories = responses.map(({ rows }) => rows[0]);


    await Promise.all(
      albums.map(album => {
        const categoryId = getCategoryId(album, categories);
        return client.query(`
                    INSERT INTO albums (name, image, description, category_id, price, is_old, owner_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `,
          [album.name, album.image, album.description, categoryId, album.price, album.is_old, user.id]);
      })
    );


    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch (err) {
    console.log(err);
  }
  finally {
    client.end();
  }

}
