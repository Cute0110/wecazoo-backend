const Joi = require("joi");

exports.errorHandler = (res, error, statusCode = 400) => {
    let errorMessage = "";
    console.log(error);

    if (typeof error == "object") {
        errorMessage = error.message;
    } else {
        errorMessage = error;
    }

    return res.status(statusCode).json({
        status: 0,
        message: errorMessage,
    });
};

exports.validateSchema = (res, input, schema) => {
    const result = schema.validate(input);
    if (result.error) {
        console.error(result.error);

        res.status(400).json({
            success: false,
            error: "Validation Error",
            validate: result.error,
        });

        return false;
    }

    return true;
};

exports.isEmpty = (value) =>
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0);
