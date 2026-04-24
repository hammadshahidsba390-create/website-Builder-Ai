import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/UserRoutes.js';
import { getProjectById } from './controllers/projectController.js';

const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,   // ✅ FIXED
};

app.use(cors(corsOptions));

app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json({limit: '50mb'}));

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.use('/api/user',userRouter);

// Public route: view a single published project (no auth required)
app.get('/api/project/:projectId', getProjectById);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});