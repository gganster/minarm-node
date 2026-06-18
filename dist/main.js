"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./types/express.d.ts");
const express_1 = __importDefault(require("express"));
const dogs_routes_1 = require("./routes/dogs.routes");
const users_routes_js_1 = require("./routes/users.routes.js");
const logguer_1 = require("./middlewares/logguer");
const error_1 = require("./middlewares/error");
const express_rate_limit_1 = require("express-rate-limit");
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 10 * 60 * 1000,
    limit: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path === '/health', // le healthcheck ne doit jamais être throttlé
    message: { error: 'Trop de requêtes, réessayez plus tard' },
});
app.use(limiter);
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(logguer_1.logguer);
app.use("/dogs", dogs_routes_1.dogRouter);
app.use("/auth", users_routes_js_1.userRouter);
app.use(error_1.errorMiddleware);
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
