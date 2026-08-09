import type { Context } from 'hono';
import { reddit, settings } from "@devvit/web/server";

export const handleAppUpgrade = async (c: Context) => {
  try {
    const event = await c.req.json();
    console.log(`App upgrade payload received.`);

    const subreddit = await reddit.getCurrentSubreddit();
    const appAccount = await reddit.getAppUser();

    let firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    firstMsg += `Thanks for updating **Weathercast**!\n\n`;
    firstMsg += `Weathercast automatically tracks and posts live severe weather and tropical data to your subreddit, keeping your community updated without the need for any manual megathreads.\n\n`;

    /* WHAT'S NEW */
    firstMsg += `**What's new:**\n\n\n`;
    firstMsg += `- **Unlocked Dashboards:** Daily dashboard posts are now unlocked by default, transforming them into active megathreads for your community.\n`;
    firstMsg += `- **Unsticky Posts Fix:** Resolved an issue where previous daily dashboards were not automatically unstickying.\n`;
    firstMsg += `- **Bot Flair Update:** Added a \`Weather Bot 📡\` user flair to Weathercast for clarity on subreddit role.\n`;
    firstMsg += `- **App Upgrade Notifier:** Added app upgrade notifier system to notify subreddits when app upgrades are available.\n`;
    firstMsg += `- **Added install/upgrade triggers** Triggers were added to provide subreddit mod teams with useful info on app install/upgrade.\n\n`;

    /* REMINDERS */
    firstMsg += `**Good to know / reminders:**\n\n\n`;
    firstMsg += `- **Daily Dashboards:** A new Severe Weather Dashboard is automatically posted to your subreddit each day.\n`;
    firstMsg += `- **Auto-Updating:** The dashboard refreshes every 15 minutes, pulling live data from the SPC and NHC.\n`;
    firstMsg += `- **Clean Transitions:** When a new day starts, Weathercast drops a fresh dashboard and unstickies and locks the previous day's post.\n\n`;

    /* CONFIG LINKS */
    firstMsg += `**Configure now:** Manage any subreddit-specific settings here → [Weathercast settings](https://developers.reddit.com/r/${subreddit.name}/apps/weathercast)\n\n\n`;

    /* FOOTER */
    firstMsg += `[Terms & Conditions](https://www.reddit.com/r/NovrixApps/wiki/weathercast/terms-and-conditions) | `;
    firstMsg += `[Privacy Policy](https://www.reddit.com/r/NovrixApps/wiki/weathercast/privacy-policy/) | `;
    firstMsg += `[Contact](https://www.reddit.com/r/NovrixApps/)\n\n`;

    await reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "weathercast",
      subject: `Weathercast: App Update`,
      text: firstMsg,
    });
    console.log(`Message sent to r/${subreddit.name} mods.`);
    
      await reddit.setUserFlair({
        subredditName: subreddit.name,
        username: appAccount!.username,
        text: "Weather Bot 📡",
        textColor: "light",
        backgroundColor: "#2200ff",
      });

    return c.json({ success: true });
  } catch (error) {
    console.error("Crash prevented in AppUpgrade trigger:", error);
    return c.json({ success: false, error: String(error) });
  }
};