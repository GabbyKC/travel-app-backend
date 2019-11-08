const express = require("express");
const router = express.Router();
const cityModel = require("../model/cityModel");
const { check, validationResult } = require('express-validator');
const itineraryModel = require("../model/itineraryModel");

router.get('/', (req, res) => {
    cityModel
        .find({})
        .then(cities => {
            res.send(cities);
        })
        .catch(err => console.log(err));
});

router.post('/', [
    check('name').isString().isLength({ min: 1 }),
    check('country').isString().isLength({ min: 1 }),
    check('img').isURL(),
],(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const {name, country, img} = req.body;
    cityModel.find({name: {"$regex": name, "$options": "i"}})
        .then(result => {
            if (result.length > 0) {
                res.status(409).send(`City '${name}' already exists`);
            } else {
                const newCity = new cityModel({
                    name: name,
                    country: country,
                    img: img,
                });

                newCity.save()
                    .then(city => {
                        res.send(city)
                    })
                    .catch(err => {
                        res.status(500).send({"errors": [{"msg": `Server error: ${err}`}]})
                    })
            }
        })
        .catch(err => console.log(err));
});

// not used
router.get('/:name',
    (req, res) => {
        let cityRequested = req.params.name;
        cityModel.findOne({name: cityRequested})
            .then(city => {
                res.send(city)
            })
            .catch(err => console.log(err));
    }
);

router.get('/:cityId/itineraries',
    (req, res) => {
        let cityRequested = req.params.cityId;

        itineraryModel.find(({city: cityRequested}))
            .populate('city')
            .then(itineraries => {
                res.send(itineraries);
            })
            .catch(err => console.log(err));
    }
);

module.exports = router;