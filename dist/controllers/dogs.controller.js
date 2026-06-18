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
exports.deleteDog = exports.updateDog = exports.createDog = exports.getDog = exports.listDogs = void 0;
const DogsService = __importStar(require("../services/dogs.service"));
const error_1 = require("../middlewares/error");
const listDogs = async (req, res) => res.json(await DogsService.getDogs());
exports.listDogs = listDogs;
const getDog = async (req, res) => {
    const id = Number(req.safeParams.id);
    const dog = await DogsService.getDogById(id);
    if (!dog)
        throw new error_1.NotFoundError;
    return res.status(200).json(dog);
};
exports.getDog = getDog;
const createDog = async (req, res) => {
    const createdDog = await DogsService.createDog(req.body);
    return res.status(201).json(createdDog);
};
exports.createDog = createDog;
const updateDog = async (req, res) => {
    const id = Number(req.safeParams.id);
    const dog = await DogsService.getDogById(id);
    if (!dog)
        throw new error_1.NotFoundError;
    const updatedDog = await DogsService.updateDog(id, req.body);
    return res.status(200).json(updatedDog);
};
exports.updateDog = updateDog;
const deleteDog = async (req, res) => {
    const id = Number(req.safeParams.id);
    const dog = await DogsService.getDogById(id);
    if (!dog)
        throw new error_1.NotFoundError;
    const deletedDog = await DogsService.deleteDog(id);
    return res.status(200).json(deletedDog);
};
exports.deleteDog = deleteDog;
