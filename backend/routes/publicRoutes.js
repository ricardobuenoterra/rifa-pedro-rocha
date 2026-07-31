const router = require('express').Router();
const raffle = require('../controllers/raffleController');
router.get('/raffle', raffle.publicData);
router.post('/reserve', raffle.reserve);
router.get('/consult', raffle.consult);
module.exports = router;
