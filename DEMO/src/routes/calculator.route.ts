import { Router } from 'express';
import { baseReport, calculate, report, override } from '../controllers/calculator.controller';

const router = Router();

router.get('/base-report', baseReport);
router.post('/calculate', calculate);
router.get('/report', report);
router.post('/override', override);

export default router;