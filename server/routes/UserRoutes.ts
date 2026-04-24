import express from 'express';
import {
  createUserProject,
  getusercredits,
  getUserProject,
  getUserProjects,
  purchaseCredits,
  togglePublish
} from '../controllers/UserController.js';
import {
  makeRevision,
  rollbackToVersion,
  deleteProject,
  getProjectPreview,
  getPublishedProject,
  getProjectById,
  saveProjectCode
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const userRouter = express.Router();

// User / Credits
userRouter.get('/credits', protect, getusercredits);
userRouter.post('/purchase-credits', protect, purchaseCredits);

// Projects list
userRouter.get('/projects', protect, getUserProjects);
userRouter.get('/published-projects', getPublishedProject);  // public — no auth needed

// Single project CRUD
userRouter.post('/project', protect, createUserProject);
userRouter.get('/project/:projectId', protect, getUserProject);
userRouter.delete('/project/:projectId', protect, deleteProject);

// Save code
userRouter.post('/project/:projectId/save', protect, saveProjectCode);

// Revision (AI regeneration)
userRouter.post('/project/:projectId/revision', protect, makeRevision);

// Rollback to a previous version
userRouter.post('/project/:projectId/rollback/:versionId', protect, rollbackToVersion);

// Publish toggle
userRouter.get('/publish-toggle/:projectId', protect, togglePublish);

// Preview (owner)
userRouter.get('/project/:projectId/preview', protect, getProjectPreview);

export default userRouter;