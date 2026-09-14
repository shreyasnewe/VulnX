import { Router } from 'express';
import { getHealth, runTestScan } from '../controllers/healthController';

const router = Router();

router.get('/health', getHealth);
router.get('/status', getHealth);
router.post('/scanner/test', runTestScan);

export default router;
