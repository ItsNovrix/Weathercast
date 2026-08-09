import { reddit, redis } from "@devvit/web/server";

interface AppUpdate {
    appname: string;
    version: string;
    whatsNewBullets: string[];
}

const UPDATE_SUBREDDIT = "NovrixApps";
const UPDATE_WIKI_PAGE = "upgrade-notifier";
const APP_SLUG = "weathercast"; 
const CURRENT_APP_VERSION = "0.0.28";

function isNewerVersion(current: string, latest: string): boolean {
    const v1 = current.split('.').map(Number);
    const v2 = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0;
        const num2 = v2[i] || 0;
        if (num2 > num1) return true;
        if (num2 < num1) return false;
    }
    return false;
}

export async function checkForUpdates(subredditName: string) {
    try {
        let wikiPage;
        try {
            wikiPage = await reddit.getWikiPage(UPDATE_SUBREDDIT, UPDATE_WIKI_PAGE);
        } catch (err) {
            console.error(`Update Checker: Could not read wiki page ${UPDATE_WIKI_PAGE} on r/${UPDATE_SUBREDDIT}`);
            return;
        }

        const updates = JSON.parse(wikiPage.content) as AppUpdate[];
        const updatesForThisApp = updates.filter(update => update.appname === APP_SLUG);
        
        if (updatesForThisApp.length === 0) return;

        const latestUpdate = updatesForThisApp[0];

        if (!isNewerVersion(CURRENT_APP_VERSION, latestUpdate.version)) {
            return;
        }

        const redisKey = `update_notified_${latestUpdate.version}`;
        const alreadySent = await redis.get(redisKey);
        
        if (alreadySent === "true") {
            return;
        }

        let message = `A new version of **Weathercast** (v${latestUpdate.version}) is available to install.\n\n`;
        
        if (latestUpdate.whatsNewBullets && latestUpdate.whatsNewBullets.length > 0) {
            message += `**Here's what's new:**\n`;
            latestUpdate.whatsNewBullets.forEach(bullet => {
                message += `* ${bullet}\n`;
            });
            message += `\n`;
        }

        message += `To install this update, visit the [**Weathercast Configuration Page**](https://developers.reddit.com/r/${subredditName}/apps/${APP_SLUG}).`;

        await reddit.modMail.createModNotification({
            subredditId: (await reddit.getCurrentSubreddit()).id,
            subject: `New Weathercast Update Available: v${latestUpdate.version}`,
            bodyMarkdown: message,
        });

        console.log(`Update Checker: Notification sent for version ${latestUpdate.version}`);

        await redis.set(redisKey, "true");

    } catch (error) {
        console.error("Error in update checker:", error);
    }
}