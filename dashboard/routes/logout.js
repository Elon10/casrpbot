const express = require("express"),
    router = express.Router();

router.get("/", async function (req, res) {
    req.session.destroy();
    res.redirect(req.client.config.DASHBOARD.failureURL);
});

module.exports = router;