"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const handovers_routes_1 = require("./routes/handovers.routes");
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(auth_middleware_1.attachAuthenticatedUser);
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    app.use('/api/v1/handovers', handovers_routes_1.handoverRouter);
    return app;
}
if (require.main === module) {
    const app = createApp();
    const port = Number(process.env.PORT ?? 4000);
    app.listen(port, () => {
        console.log(`OCC backend listening on http://localhost:${port}`);
    });
}
