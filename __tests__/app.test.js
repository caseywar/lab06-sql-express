require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;

    beforeAll(async done => {
      execSync('npm run setup-db');

      client.connect();

      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });

      token = signInData.body.token; // eslint-disable-line

      return done();
    });

    afterAll(done => {
      return client.end(done);
    });

    test('returns albums', async () => {

      const expectation = [
        {
          'id': 1,
          'name': 'Channel Orange',
          'image': 'https://media.pitchfork.com/photos/5929be57c0084474cd0c2e8c/1:1/w_600/45e3c196.jpeg',
          'description': 'The debut studio album by American R&B singer and songwriter Frank Ocean',
          'category': 'Alternative',
          'category_id': 1,
          'price': 10,
          is_old: false,
          'owner_id': 1
        },
        {
          'id': 2,
          'name': 'Man on the Moon III: The Chosen',
          'image': 'https://resources.tidal.com/images/0928ef0e/0eb4/464d/af75/72b38a3712d3/640x640.jpg',
          'description': 'The seventh studio album by American rapper Kid Cudi',
          'category': 'Hip Hop',
          'category_id': 2,
          'price': 20,
          'is_old': false,
          'owner_id': 1
        },
        {
          'id': 3,
          'name': 'Mordechai',
          'image': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Khruangbin_Mordechai_Cover.png/220px-Khruangbin_Mordechai_Cover.png',
          'description': 'The third studio album by American musical trio Khruangbin',
          'category': 'Alternative',
          'category_id': 1,
          'price': 15,
          'is_old': false,
          'owner_id': 1
        },
        {
          'id': 4,
          'name': 'Jazz for the Jet Set',
          'image': 'https://img.discogs.com/JXBhVIcnstwd2ZIp5aX6ZZ0RgvA=/fit-in/300x300/filters:strip_icc():format(jpeg):mode_rgb():quality(40)/discogs-images/R-2756468-1345014171-2452.jpeg.jpg',
          'description': 'An album by American jazz vibraphonist Dave Pike',
          'category': 'Jazz',
          'category_id': 3,
          'price': 25,
          'is_old': true,
          'owner_id': 1
        },
        {
          'id': 5,
          'name': 'Abacab',
          'image': 'https://progressivemusicplanet.files.wordpress.com/2016/07/115864557.jpg',
          'description': 'The eleventh studio album by English rock band Genesis',
          'category': 'Art Rock',
          'category_id': 4,
          'price': 20,
          'is_old': true,
          'owner_id': 1
        },
        {
          'id': 6,
          'name': 'Morning View ',
          'image': 'https://upload.wikimedia.org/wikipedia/en/6/68/Incubus_-_Morning_View.jpg',
          'description': 'The fourth studio album by American rock band Incubus',
          'category': 'Art Rock',
          'category_id': 4,
          'price': 15,
          'is_old': false,
          'owner_id': 1
        }
      ];

      const data = await fakeRequest(app)
        .get('/albums')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expect.arrayContaining(expectation));
    });

    test('returns a single album with the matching id', async () => {

      const expectation = {
        'id': 2,
        'name': 'Man on the Moon III: The Chosen',
        'image': 'https://resources.tidal.com/images/0928ef0e/0eb4/464d/af75/72b38a3712d3/640x640.jpg',
        'description': 'The seventh studio album by American rapper Kid Cudi',
        'category': 'Hip Hop',
        'category_id': 2,
        'price': 20,
        is_old: false,
        'owner_id': 1
      };

      const data = await fakeRequest(app)
        .get('/albums/2')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);


      const nothing = await fakeRequest(app)
        .get('/albums/100')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(nothing.body).toEqual('');
    });


    test('creates a new album and that new album is in our album list', async () => {
      // define the new candy we want create
      const newAlbum = {
        name: 'The Dark Side of The Moon',
        image: 'cool pic',
        description: 'The Dark Side of the Moon is the eighth studio album by the English rock band Pink Floyd',
        category_id: 4,
        price: 20,
        is_old: true
      };

      // define what we expect that candy to look like after SQL does its thing
      const expectedAlbum = {
        ...newAlbum,
        id: 7,
        owner_id: 1,
      };

      // use the post endpoint to create a candy
      const data = await fakeRequest(app)
        .post('/albums')
        // pass in our new candy as the req.body
        .send(newAlbum)
        .expect('Content-Type', /json/)
        .expect(200);

      // we expect the post endpoint to responds with our expected candy
      expect(data.body).toEqual(expectedAlbum);

      // we want to check that the new candy is now ACTUALLY in the database
      const allAlbums = await fakeRequest(app)
        // so we fetch all the candies
        .get('/albums')
        .expect('Content-Type', /json/)
        .expect(200);

      // we go and find the turkish delight
      const getExpectation = {
        ...expectedAlbum,
        category: 'Art Rock'
      };
      // we check to see that the turkish delight in the DB matches the one we expected
      expect(allAlbums.body).toContainEqual(getExpectation);
    });


    test('deletes a single album with the matching id', async () => {
      const expectation = {
        'id': 2,
        'name': 'Man on the Moon III: The Chosen',
        'image': 'https://resources.tidal.com/images/0928ef0e/0eb4/464d/af75/72b38a3712d3/640x640.jpg',
        'description': 'The seventh studio album by American rapper Kid Cudi',
        'category_id': 2,
        'price': 20,
        'is_old': false,
        'owner_id': 1
      };

      const data = await fakeRequest(app)
        .delete('/albums/2')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);

      const nothing = await fakeRequest(app)
        .get('/albums/2')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(nothing.body).toEqual('');
    });


    test('updates an album', async () => {
      // define the new candy we want create
      const newAlbum = {
        name: 'cool music',
        image: 'cool pic',
        description: 'awesome album ',
        category_id: 4,
        price: 20,
        is_old: false,
      };

      const expectedAlbum = {
        ...newAlbum,
        category: 'Art Rock',
        owner_id: 1,
        id: 1
      };


      // use the put endpoint to update a candy
      await fakeRequest(app)
        .put('/albums/1')
        // pass in our new candy as the req.body
        .send(newAlbum)
        .expect('Content-Type', /json/)
        .expect(200);

      // go grab the candy we expect to be updated
      const updatedAlbum = await fakeRequest(app)
        .get('/albums/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // check to see that it matches our expectations
      expect(updatedAlbum.body).toEqual(expectedAlbum);
    });

    const { getCategoryId } = require('../data/dataUtils.js');

    describe('data utils', () => {

      test('getCategoryId should take in a candy and all categories and return the appropriate id', async () => {
        const expectation = 7;
        const album = {
          name: 'Channel Orange',
          category: 'Alternative'
        };
        const categories = [
          {
            id: 5,
            name: 'Hip Hop'
          },
          {
            id: 7,
            name: 'Alternative',
          },
          {
            id: 3,
            name: 'Jazz'
          }
        ];

        const actual = getCategoryId(album, categories);

        expect(actual).toEqual(expectation);
      });


    });

  });
});
