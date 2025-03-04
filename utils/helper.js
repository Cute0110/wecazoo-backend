const Joi = require("joi");
const { eot, dot } = require('./cryptoUtils');

exports.errorHandler = (res, error, statusCode = 400) => {
    let errorMessage = "";
    console.log("ErrorHandler Error!!!!!!!!!!!", error);

    if (typeof error == "object") {
        errorMessage = error.message;
    } else {
        errorMessage = error;
    }

    return res.json(eot({
        status: 0,
        msg: errorMessage,
    }));
};

exports.validateSchema = (res, input, schema) => {
    const result = schema.validate(input);
    if (result.error) {
        console.error(result.error);

        res.json(eot({
            status: 0,
            msg: "Validation Error",
        }));

        return false;
    }

    return true;
};

exports.isEmpty = (value) =>
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0);
