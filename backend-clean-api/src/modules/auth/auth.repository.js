const User = require("../../models/user.model");

class AuthRepository {
    async createUser(data) {
        return User.create(data);
    }

    async findUserByEmail(email) {
        return User.findOne({ email }).select("+password");
    }

    async existsByEmail(email) {
        return User.exists({ email });
    }
}

module.exports = new AuthRepository();
