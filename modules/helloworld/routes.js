import { Router } from 'express';
import {
  helloWorld,
  helloWorldPath,
  helloWorldQuery,
  helloWorldPayload,
  helloWorldError,
} from './api.js';

const router = Router();

router.get('/', helloWorld);
router.get('/path/:message', helloWorldPath);
router.get('/query', helloWorldQuery);
router.post('/payload', helloWorldPayload);
router.get('/error/:type', helloWorldError);

export default router;
