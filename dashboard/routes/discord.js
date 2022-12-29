const express = require("express"),
    router = express.Router();

const fetch = require("node-fetch"),
    btoa = require("btoa");

router.get("/login", async function (req, res) {
    if (!req.user || !req.user.id || !req.user.guilds) {
        if (!req.client.user?.id) {
            req.client.logger.debug("Client is not ready! Redirecting to /login");
            return res.redirect("/login");
        }

        return res.redirect(
            `https://discordapp.com/api/oauth2/authorize?client_id=${req.client.user.id
            }&scope=identify%20guilds&response_type=code&redirect_uri=${encodeURIComponent(
                req.client.config.DASHBOARD.baseURL + "/api/callback"
            )}&state=${req.query.state || "no"}`
        );
    }
    res.redirect("/staff/homePage");
});

router.get("/callback", async (req, res) => {
    if (!req.query.code) return res.redirect(req.client.config.DASHBOARD.failureURL);
    const redirectURL = req.client.states[req.query.state] || "/staff/homePage";
    const params = new URLSearchParams();
    params.set("grant_type", "authorization_code");
    params.set("code", req.query.code);
    params.set("redirect_uri", `${req.client.config.DASHBOARD.baseURL}/api/callback`);
    let response = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        body: params.toString(),
        headers: {
            Authorization: `Basic ${btoa(`${req.client.user.id}:${process.env.BOT_SECRET}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const tokens = await response.json();
    if (tokens.error || !tokens.access_token) {
        req.client.logger.debug(tokens);
        req.client.logger.error("Failed to login to dashboard");
        return res.redirect(`/api/login&state=${req.query.state}`);
    }
    const userData = {
        infos: null,
        guilds: null,
    };
    while (!userData.infos || !userData.guilds) {
        if (!userData.infos) {
            response = await fetch("http://discordapp.com/api/users/@me", {
                method: "GET",
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            const json = await response.json();
            if (json.retry_after) await req.client.wait(json.retry_after);
            else userData.infos = json;
        }
        if (!userData.guilds) {
            response = await fetch("https://discordapp.com/api/users/@me/guilds", {
                method: "GET",
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            const json = await response.json();
            if (json.retry_after) await req.client.wait(json.retry_after);
            else userData.guilds = json;
        }
    }
    const guilds = [];
    for (const guildPos in userData.guilds) guilds.push(userData.guilds[guildPos]);

    req.session.user = { ...userData.infos, ...{ guilds } }; 
    res.redirect(redirectURL);
});

module.exports = router;