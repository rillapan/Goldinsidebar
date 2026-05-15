import { Router } from 'express';
import { verifyToken, checkMembership } from '../middleware/auth.middleware';
import {
  generateMagicLink,
  getTelegramStatus,
  updatePreferences,
  testNotification,
  disconnectTelegram,
  generateChannelInvite
} from '../controller/telegram.controller';

const router = Router();

// Semua rute telegram butuh authentication
router.use(verifyToken);

router.get('/status', getTelegramStatus);
router.post('/magic-link', generateMagicLink);
router.put('/preferences', updatePreferences);
router.post('/test', testNotification);
router.post('/disconnect', disconnectTelegram);

// Rute ini butuh membership aktif (atau pending/suspend tidak bisa)
router.post('/channel-invite', checkMembership, generateChannelInvite);

export default router;
