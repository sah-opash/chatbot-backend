const UserModel = require("../../models/user.model");
const { getPagination, getCount, getPaginationData } = require("../../utils/fn");
const { sendSuccessResponse, sendErrorResponse } = require("../../utils/response");

exports.createAgent = async (req, res) => {
    try {
        const { _id: adminId } = req.user;
        const { email, password, role, fullName, mobileNumber, preferredEmirates,department } = req.body;

        const adminRole = req.user.role;

        if (adminRole !== "Admin" && adminRole !== "SuperAdmin") {
            return sendErrorResponse(res, "You are not authorized to perform this operation.", 403, true, true);
        }

        const existingUser = await UserModel.findOne({ email: email });
        if (!existingUser) {
            const user = new UserModel({
                fullName,
                email,
                role,
                password,
                mobileNumber,
                preferredEmirates,
                ...(department && { department })
            });
            const savedUser = await user.save();
            const populatedUser = await savedUser.populate('department')
            sendSuccessResponse(res, { data: populatedUser });
        } else {
            return sendErrorResponse(
                res,
                "Account with that email address already exists.",
                400,
                true,
                true
            );
        }
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
}

exports.getAllAgents = async (req, res) => {
    try {
        const { page, size, search } = req.query;
        const { limit, offset } = getPagination(page, size);
        const count = await getCount(
            UserModel,
            {
                role: { $nin: ["User", "Admin"] },
                ...(search
                    ? {
                        $or: [
                            { fullName: new RegExp(search, "i") },
                            { email: new RegExp(search, "i") },
                            { mobileNumber: new RegExp(search, "i") },
                        ],
                    }
                    : {}),
            },
        );
        const users = await UserModel.find(
            {
                role: { $nin: ["User", "Admin"] },
                ...(search
                    ? {
                        $or: [
                            { fullName: new RegExp(search, "i") },
                            { email: new RegExp(search, "i") },
                            { mobileNumber: new RegExp(search, "i") },
                        ],
                    }
                    : {}),
            }
        )
            .skip(offset)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('department');

        sendSuccessResponse(res, getPaginationData({ count, docs: users }, page, limit));
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
}

exports.getAgent = async (req, res) => {
    try {
        const { userId } = req.params;
        const agent = await UserModel.findById(userId).populate('department');
        sendSuccessResponse(res, { data: agent });
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
}

exports.updateAgents = async (req, res) => {
    try {
        const { _id: adminId, role } = req.user;
        const { userId } = req.params;

        if (role !== "Admin" && role !== "SuperAdmin") {
            return sendErrorResponse(res, "You are not authorized to perform this operation.", 403, true, true);
        }

        let columns = Object.keys(req.body);
        let columnNames = columns.map((val) => {
            return { [val]: req.body[val] };
        });
        const mergedObject = columnNames.reduce((result, currentObject) => {
            return { ...result, ...currentObject };
        }, {});

        const updateUser = await UserModel.findByIdAndUpdate(
            userId,
            mergedObject,
            {
                new: true
            }
        );

        sendSuccessResponse(res, { data: updateUser });
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
}

// change user password
exports.changePassword = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { password, newPassword } = req.body;
        const user = await UserModel.findById(userId).select("+password");
        if (!user) {
            return sendErrorResponse(res, "We are not aware of this user.", 500, true, true);
        }
        if (user) {
            user.password = newPassword;
            await user.save();
            sendSuccessResponse(res, { data: user });
        }
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
};

exports.deleteAgent = async (req, res) => {
    try {
        const { _id: adminId, role } = req.user;
        const { userId } = req.params;

        if (role !== "Admin" && role !== "SuperAdmin") {
            return sendErrorResponse(res, "You are not authorized to perform this operation.", 403, true, true);
        }

        const deleteUser = await UserModel.findByIdAndDelete(userId);
        sendSuccessResponse(res, { data: "User deleted." })
    } catch (error) {
        sendErrorResponse(res, error.message);
    }
}

// exports.listAllAgent = async (req, res) => {
//     try {
//         const { _id: adminId, role } = req.user;
//         const { claimId } = req.params;

//         const claim = await ClaimModel.findById(claimId);
//         const preferredEmiratesOfRepair = claim?.preferredEmiratesOfRepair;

//         const users = await UserModel.find(
//             {
//                 role: { $in: ["Agent", "Admin", "Supervisor"] },
//                 preferredEmirates: { $in: preferredEmiratesOfRepair }
//             }
//         )
//         sendSuccessResponse(res, { data: users });
//     } catch (error) {
//         sendErrorResponse(res, error.message);
//     }
// }