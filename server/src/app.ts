import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { noticesRouter } from './modules/notices/notices.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { postsRouter } from './modules/posts/posts.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { quizzesRouter } from './modules/quizzes/quizzes.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { teacherRouter } from './modules/teacher/teacher.routes';

export const app = express();

// CSP disabled: this process also serves the static web-build SPA bundle below (demo
// convenience, not a production deployment), and helmet's default CSP blocks the inline
// bits Expo's web export relies on.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') }));
app.use(express.json());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/notices', noticesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/teacher', teacherRouter);

// Serves the Expo web export (../web-build, built via `npx expo export --platform web`) from
// this same server/port — so the live demo is one URL for both the API and the UI, not a
// second tunnel/port to manage. Purely a demo convenience, not how this would be deployed
// for real (the app and API would normally be separate deployments).
const webBuildPath = path.join(__dirname, '..', '..', 'web-build');
if (fs.existsSync(webBuildPath)) {
  app.use(express.static(webBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(webBuildPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
