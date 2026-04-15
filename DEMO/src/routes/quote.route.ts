import { Router } from 'express';
import { exportQuote, getRecommendation } from '../controllers/quote.controller';

const router = Router();

router.post('/cpq/quotes/export', exportQuote);
router.post('/cpq/quotes/recommend-price', getRecommendation);

export default router;
