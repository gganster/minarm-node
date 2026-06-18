"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateBody = void 0;
const validateBody = (schema) => {
    return (req, res, next) => {
        req.body = schema.parse(req.body);
        next();
    };
};
exports.validateBody = validateBody;
const validateParams = (schema) => {
    return (req, res, next) => {
        req.safeParams = schema.parse(req.params);
        next();
    };
};
exports.validateParams = validateParams;
