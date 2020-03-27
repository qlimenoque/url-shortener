const {Router} = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const router = Router();

// /api/auth/login
router.post(
    '/register',
    [
        check('email', 'Email is incorrect').isEmail(),
        check('password', 'Minimum 6 symbols is required for password').isLength({ min: 6 })
    ],
    async (req, res) => {
        console.log('Body: ', req.body);
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json( { errors: errors.array(), message: 'Incorrect entries' });
            const {email, password} = req.body;
            const candidate = await User.findOne({ email });

            if (candidate) {
                return res.status(400).json({message: 'User is already exist'})
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const user = new User({ email, password: hashedPassword });

            await user.save();
            res.status(201).json({ message: 'User is created successfully.'})
        } catch (e) {
            res.status(500).json( {message: 'Something went wrong. Try again'})
        }
    });

// /api/auth/login
router.post(
    '/login',
    [
        check('email', 'Enter valid email').normalizeEmail().isEmail(),
        check('password', 'Enter password').exists()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json( { errors: errors.array(), message: 'Incorrect login or password' });

            const {email, password} = req.body
            const user = await User.findOne( {email});

            if (!user) return res.status(400).json({message: 'User is not found'});

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) return res.status(400).json( { message: 'Password is incorrect. Try again'} )

            const token = jwt.sign(
                { userId: user.id },
                config.get('jwtSecret'),
                { expiresIn: '1h' }
            );

            res.json({ token, userId: user.id })
        } catch (e) {
            res.status(500).json( {message: 'Something went wrong. Try again'})
        }
    });

module.exports = router;