import express from 'express';
import upload from '../../config/multer.js';
import { createCategory, createCity, createCountry, createState, deleteDatasetSource, getCategories, getCities, getCountries, getDatasetRecords, getDatasets, getDatasetSourcePreview, getDatasetSources, getFilterOptions, getStates, uploadDataFile } from '../../controllers/admin/manageDataset.js';
import { auth, requireRole } from '../../middleware/auth.js';


const router = express.Router();

router.post(
  '/admin/manage-data/upload-data',
  auth,
  requireRole('admin'),
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'proofAttachment', maxCount: 1 }
  ]),
  uploadDataFile
);
router.get("/datasets", getDatasets);
router.get("/datasets/:id/records", getDatasetRecords);

router.get("/categories", getCategories);
router.get("/countries", getCountries);
router.get("/states", getStates);
router.get("/city", getCities);
router.get("/cities", getCities);
router.get("/filter-options", getFilterOptions);





router.post("/categories", auth, requireRole('admin'), createCategory);


router.post("/countries", auth, requireRole('admin'), createCountry);

      
router.post("/states", auth, requireRole('admin'), createState);

router.get("/datasets/sources", auth, requireRole('admin'), getDatasetSources);
router.get("/datasets/sources/:id", auth, requireRole('admin'), getDatasetSourcePreview);


router.delete("/datasets/sources/:id", auth, requireRole('admin'), deleteDatasetSource);

router.post("/cities", auth, requireRole('admin'), createCity);



export default router;
