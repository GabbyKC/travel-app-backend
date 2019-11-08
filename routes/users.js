const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const {check, validationResult} = require('express-validator');
const passport = require("passport");

const userModel = require('../model/userModel');
const secretKey = require('../keys').secret;
const saltRounds = 10;

router.post('/', [
    check('email').isEmail(),
    check('password').isLength({min: 5}).withMessage('Password must be at least 5 characters long')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    const {name, email, password} = req.body;
    userModel.findOne({email: {"$regex": email, "$options": "i"}})
        .then(result => {
            if (result) {
                res.status(409).send({"errors": [{"msg": "Email is already in use"}]});
            } else {
                let salt = bcrypt.genSaltSync(saltRounds);
                let hashedPassword = bcrypt.hashSync(password, salt);

                const newUser = new userModel({
                    name: name,
                    email: email,
                    password: hashedPassword,
                });

                newUser.save()
                    .then(user => {
                        res.send({
                                id: user._id,
                                userName: user.name,
                                email: user.email,
                            }
                        )
                    })
                    .catch(err => {
                        res.status(500).send({"errors": [{"msg": `Server error ${err}`}]})
                    })
            }
        })
        .catch(err => console.log(err));
});

router.post('/login', [
    check('email').isEmail(),
    check('password').isLength({min: 5})
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({"errors": [{"msg": "Invalid credentials"}]});
    }

    const {email, password} = req.body;
    userModel.findOne({email: {"$regex": email, "$options": "i"}})
        .then(existingUser => {
            if (existingUser) {
                let passwordsMatch = bcrypt.compareSync(password, existingUser.password);

                if (!passwordsMatch) {
                    res.status(401).json({"errors": [{"msg": "Invalid credentials"}]});
                } else {
                    const payload = {
                        id: existingUser._id,
                        name: existingUser.name,
                        email: existingUser.email,
                    };
                    const options = {expiresIn: 2592000};//30 days from now
                    jwt.sign(
                        payload,
                        secretKey,
                        options,
                        (err, token) => {
                            if (err) {
                                res.status(401).json({"errors": [{"msg": "Invalid credentials"}]});
                            } else {
                                res.json({
                                    token: token
                                });
                            }
                        }
                    );
                }
            } else {
                res.status(401).json({"errors": [{"msg": "Invalid credentials"}]});
            }
        })
        .catch(err => console.log(err));
});

router.post('/favoriteItineraries/:itineraryId',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        userModel
            .findOne({_id: req.user.id})
            .then(user => {
                const itineraryId = req.params.itineraryId;
                if (!user.favoriteItineraries.includes(itineraryId)) {
                    user.favoriteItineraries.push(itineraryId);

                    user.save()
                        .then(user => {
                            user.populate({
                                path: 'favoriteItineraries',
                                model: 'itinerary',
                                populate: [{
                                    path: 'city',
                                    model: 'city'
                                }]
                            }).execPopulate()//necessary when populating on save()
                                .then(user =>
                                res.json({
                                    id: user._id,
                                    userName: user.name,
                                    email: user.email,
                                    favoriteItineraries: user.favoriteItineraries,
                                })
                            );
                        })
                } else {
                    res.status(409).send()
                }
            }).catch(err => res.status(404).json({"errors": [{"msg": "User not found"}]}));
    }
);

router.delete('/favoriteItineraries/:itineraryId',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        userModel
            .findOne({_id: req.user.id})
            .then(user => {
                const itineraryId = req.params.itineraryId;
                if (user.favoriteItineraries.includes(itineraryId)) {
                    user.favoriteItineraries.pop(itineraryId);

                    user.save()
                        .then(user => {
                            user.populate({
                                path: 'favoriteItineraries',
                                model: 'itinerary',
                                populate: [{
                                    path: 'city',
                                    model: 'city'
                                }]
                            }).execPopulate()//necessary when populating on save()
                                .then(user =>
                                res.json({
                                    id: user._id,
                                    userName: user.name,
                                    email: user.email,
                                    favoriteItineraries: user.favoriteItineraries,
                                })
                            );
                        })
                } else {
                    res.status(404).send()
                }
            }).catch(err => res.status(404).json({"errors": [{"msg": "User not found"}]}));
    }
);

// providing user data (authenticated) IE favorite itineraries
router.get('/',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        userModel
            .findOne({_id: req.user.id})
            .populate({
                path: 'favoriteItineraries',
                model: 'itinerary',
                populate: [{
                    path: 'city',
                    model: 'city'
                }]
            })
            .then(user => {
                res.json({
                    id: user._id,
                    userName: user.name,
                    email: user.email,
                    favoriteItineraries: user.favoriteItineraries
                });
            }).catch(err => res.status(404).json({"errors": [{"msg": "User not found"}]}));
    }
);

module.exports = router;