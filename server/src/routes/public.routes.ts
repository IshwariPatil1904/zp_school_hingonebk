import { Router } from 'express';
import {
  getSchoolProfile,
  getPublicTeachers,
  getPublicNotices,
  getPublicGallery,
  getPublicScholarships,
  submitAdmissionApplication,
  checkAdmissionStatus,
} from '../controllers/public.controller';

const router = Router();

router.get('/profile', getSchoolProfile);
router.get('/teachers', getPublicTeachers);
router.get('/notices', getPublicNotices);
router.get('/gallery', getPublicGallery);
router.get('/scholarships', getPublicScholarships);
router.post('/admissions', submitAdmissionApplication);
router.get('/admissions/status/:appNo', checkAdmissionStatus);

export default router;
