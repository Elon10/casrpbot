const { readdirSync, lstatSync } = require("fs");
const { join, extname } = require("path");
const permissions = require("./permissions");

module.exports = class Utils {
    /**
     * @param {number} max
     */
    static getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    /**
     * @param {string} text
     */
    static isHex(text) {
        return /^#[0-9A-F]{6}$/i.test(text);
    }

    /**
     * @param {Date} dt2
     * @param {Date} dt1
     */
    static diffHours(dt2, dt1) {
        let diff = (dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60 * 60;
        return Math.abs(Math.round(diff));
    }

    /**
     * @param {number} timeInSeconds
     */
    static timeformat(timeInSeconds) {
        const days = Math.floor((timeInSeconds % 31536000) / 86400);
        const hours = Math.floor((timeInSeconds % 86400) / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.round(timeInSeconds % 60);
        return (
            (days > 0 ? `${days} days, ` : "") +
            (hours > 0 ? `${hours} hours, ` : "") +
            (minutes > 0 ? `${minutes} minutes, ` : "") +
            (seconds > 0 ? `${seconds} seconds` : "")
        );
    }

    /**
     * @param {string} duration
     */
    static durationToMillis(duration) {
        return duration
            .split(":")
            .map(Number)
            .reduce((acc, curr) => curr + acc * 60) * 1000;
    }

    /**
     * @param {Date} timeUntil
     */
    static getRemainingTime(timeUntil) {
        const seconds = Math.abs((timeUntil - new Date()) / 1000);
        const time = Utils.timeformat(seconds);
        return time;
    }

    /**
     * @param {import("discord.js").PermissionResolvable[]} perms
     */
    static parsePermissions(perms) {
        const permissionWord = `permission${perms.length > 1 ? "s" : ""}`;
        return "`" + perms.map((perm) => permissions[perm]).join(", ") + "` " + permissionWord;
    }

    /**
     * @param {string} dir
     * @param {string[]} allowedExtensions
     */
    static recursiveReadDirSync(dir, allowedExtensions = [".js"]) {
        const filePaths = [];
        const readCommands = (dir) => {
            const files = readdirSync(join(process.cwd(), dir));
            files.forEach((file) => {
                const stat = lstatSync(join(process.cwd(), dir, file));
                if (stat.isDirectory()) {
                    readCommands(join(dir, file));
                } else {
                    const extension = extname(file);
                    if (!allowedExtensions.includes(extension)) return;
                    const filePath = join(process.cwd(), dir, file);
                    filePaths.push(filePath);
                }
            });
        };
        readCommands(dir);
        return filePaths;
    }
};