import { Router } from 'express';
import {
  createBiodata,
  getAllBiodata,
  getBiodataById,
  updateBiodata,
  patchBiodata,
  deleteBiodata,
} from './api.js';

const mBiodataRouter = Router();

mBiodataRouter.post('/', createBiodata);
mBiodataRouter.get('/', getAllBiodata);
mBiodataRouter.get('/:id', getBiodataById);
mBiodataRouter.put('/:id', updateBiodata);
mBiodataRouter.patch('/:id', patchBiodata);
mBiodataRouter.delete('/:id', deleteBiodata);

export default mBiodataRouter;
