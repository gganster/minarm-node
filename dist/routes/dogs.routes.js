"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dogRouter = void 0;
const express_1 = require("express");
const DogController = __importStar(require("../controllers/dogs.controller"));
const validate_1 = require("../middlewares/validate");
const dogs_schema_1 = require("../schemas/dogs.schema");
const utils_schema_1 = require("../schemas/utils.schema");
const dogRouter = (0, express_1.Router)();
exports.dogRouter = dogRouter;
dogRouter.get("/", DogController.listDogs);
dogRouter.get("/:id", (0, validate_1.validateParams)(utils_schema_1.idParamsSchema), DogController.getDog);
dogRouter.post("/", (0, validate_1.validateBody)(dogs_schema_1.dogSchema), DogController.createDog);
dogRouter.delete("/:id", (0, validate_1.validateParams)(utils_schema_1.idParamsSchema), DogController.deleteDog);
dogRouter.put("/:id", (0, validate_1.validateParams)(utils_schema_1.idParamsSchema), (0, validate_1.validateBody)(dogs_schema_1.dogSchema), DogController.updateDog);
