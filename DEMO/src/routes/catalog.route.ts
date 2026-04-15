import { Router } from 'express';
import { getCatalog } from '../controllers/catalog.controller';

const router = Router();

// GET /api/cpq/product-catalog
router.get('/cpq/product-catalog', getCatalog);

export default router;
