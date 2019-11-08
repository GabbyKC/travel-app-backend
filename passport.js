const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const userModel = require('./model/userModel');
const secretKey = process.env.JWT_SECRET;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secretKey
};

module.exports = passport => {
    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
            userModel.findById(jwt_payload.id)
                .then(user => {
                    if (user) {
                        return done(null, user);
                    }
                    return done(null, false);
                }).catch(err => console.log(err));
        })
    )
};