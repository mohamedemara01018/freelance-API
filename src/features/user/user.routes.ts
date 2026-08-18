import express from 'express'
import { changeAvatar, changePassword, getAllUser, getUserById, me, removeAvatar, updateUser } from './user.controller.js';
import { authenticationMiddleware } from '../../middleware/authentication.middleware.js';
import { upload } from '../../middleware/multer.middleware.js';


const router = express.Router();

router
    .route('/')
    .get(getAllUser)

router
    .route('/:id')
    .get(getUserById)

router
    .route('/update')
    .put(authenticationMiddleware, updateUser)

router
    .route('/change-password')
    .put(authenticationMiddleware, changePassword)

router.get('/user/me', authenticationMiddleware, me)
router.put('/image/change', upload.single('avatar'), changeAvatar)
router.delete('/image/remove', removeAvatar)



export default router