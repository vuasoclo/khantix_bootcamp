import { Router } from 'express';
import { analyzeTranscript, profile, confirmEm } from '../controllers/chat.controller';

const router = Router();

router.post('/analyze-transcript', analyzeTranscript);
router.post('/profile', profile);
router.post('/confirm-em', confirmEm);

export default router;