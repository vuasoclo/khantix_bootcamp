import { Router } from 'express';
import {
  analyzeNegotiation,
  recommendNegotiation,
  confirmNegotiationPlaybook,
} from '../controllers/negotiation.controller';

const router = Router();

router.post('/negotiation/analyze', analyzeNegotiation);
router.post('/negotiation/recommend', recommendNegotiation);
router.post('/negotiation/confirm-playbook', confirmNegotiationPlaybook);

export default router;
