import { Router } from 'express';
import { registerSchema, loginSchema } from '@contour/shared';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerHandler, loginHandler } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(registerHandler));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(loginHandler));
