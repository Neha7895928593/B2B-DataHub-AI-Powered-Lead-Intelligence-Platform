import express from 'express';
import upload from '../../config/multer.js';
import { createCategory, createCity, createCountry, createState, deleteDatasetSource, getCategories, getCities, getCountries, getDatasetRecords, getDatasets, getDatasetSources, getStates, uploadDataFile } from '../../controllers/admin/manageDataset.js';


const router = express.Router();

router.post(
  '/admin/manage-data/upload-data',
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





router.post("/categories", createCategory);


router.post("/countries", createCountry);

      
router.post("/states", createState);

router.get("/datasets/sources", getDatasetSources);


router.delete("/datasets/sources/:id", deleteDatasetSource);

router.post("/cities", createCity);



export default router;
