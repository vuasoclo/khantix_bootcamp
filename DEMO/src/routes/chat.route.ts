import { Router } from 'express';
import { analyzeTranscript, confirmEm, profile, getModulesList } from '../controllers/chat.controller';

const router = Router();

router.get('/modules', getModulesList);
router.post('/analyze-transcript', analyzeTranscript);
router.post('/profile', profile);
router.post('/confirm-em', confirmEm);

export default router;