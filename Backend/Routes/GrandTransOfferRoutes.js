
const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/authenticationMiddlware");
const ctrl = require("../Controllers/grandTransOfferController");

router.post("/transporteur/offer/:demandeId", authMiddleware, ctrl.sendOffer);
router.get("/transporteur/offers/my", authMiddleware, ctrl.getMyOffers);
router.get("/transporteur/offers/request/:demandeId", authMiddleware, ctrl.getOffersForRequest);

module.exports = router;