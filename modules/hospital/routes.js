import { Router } from 'express'
import mBiodataRouter from './m-biodata/routes.js'

const hospitalRouter = Router()

hospitalRouter.use('/m-biodata', mBiodataRouter)

export default hospitalRouter