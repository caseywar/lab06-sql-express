const client = require('../lib/client');
// import our seed data:
const albums = require('./albums.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

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

    await Promise.all(
      albums.map(album => {
        return client.query(`
                    INSERT INTO albums (id, name, image, description, category, price, owner_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `,
          [album.id, album.name, album.image, album.description, album.category, album.price, user.id]);
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
