import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

// TODO: Add authentication routes here
// Example:
router.post('/login', loginController);
router.post('/register', registerController);
router.post('/logout', logoutController);

export default router;

