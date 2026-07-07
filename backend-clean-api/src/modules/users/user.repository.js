const User = require("../../models/user.model");

class UserRepository {
    async findById(id) {
        return User.findById(id).select("-password");
    }

    async findByIdWithPassword(id) {
        return User.findById(id).select("+password");
    }

    async updateById(id, data) {
        return User.findByIdAndUpdate(id, data, {
            returnDocument: "after",
            runValidators: true,
        }).select("-password");
    }

    async emailExistsExcluding(email, excludeId) {
        return User.exists({ email, _id: { $ne: excludeId } });
    }
}

module.exports = new UserRepository();
