import express from 'express';
import upload from '../../config/multer.js';
import { createCategory, createCity, createCountry, createState, getCategories, getCities, getCountries, getDatasetRecords, getDatasets, getStates, uploadDataFile } from '../../controllers/admin/manageDataset.js';


const router = express.Router();

// Accept two files: 'file' and 'proofAttachment'
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

      // query: ?countryId=1
router.post("/states", createState);

// Cities
     // query: ?stateId=1
router.post("/cities", createCity);



export default router;
