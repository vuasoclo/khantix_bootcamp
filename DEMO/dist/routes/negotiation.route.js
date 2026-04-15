"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const negotiation_controller_1 = require("../controllers/negotiation.controller");
const router = (0, express_1.Router)();
router.post('/negotiation/analyze', negotiation_controller_1.analyzeNegotiation);
router.post('/negotiation/recommend', negotiation_controller_1.recommendNegotiation);
router.post('/negotiation/confirm-playbook', negotiation_controller_1.confirmNegotiationPlaybook);
exports.default = router;
