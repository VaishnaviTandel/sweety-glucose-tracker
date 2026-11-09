const express = require('express');
const auth = require('../middleware/auth');
const { list, create, update, remove } = require('../controllers/readingsController');

const router = express.Router();

router.use(auth); // every readings route needs a login

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;