import type { Context } from 'hono';
import { reddit, settings } from "@devvit/web/server";

export const handleAppInstall = async (c: Context) => {
  try {
    const event = await c.req.json();
    console.log(`App install payload received.`);

    const subreddit = await reddit.getCurrentSubreddit();
    const appAccount = await reddit.getAppUser();

    let firstMsg = `Hello r/${subreddit.name} mods,\n\n`;

    firstMsg += `Thanks for installing **Weathercast**!\n\n`;
    firstMsg += `Weathercast automatically tracks and posts live severe weather and tropical data to your subreddit, keeping your community updated without the need for any manual megathreads.\n\n`;

    /* QUICK START */
    firstMsg += `**How Weathercast works:**\n\n\n`;
    firstMsg += `1) **Daily Dashboards:** Each day at a pre-configured time, Weathercast automatically posts a "Severe Weather Dashboard" to your subreddit as a stickied post.\n`;
    firstMsg += `2) **Auto-Updating:** The dashboard refreshes every 15 minutes, pulling live data from the SPC (Storm Prediction Center) and NHC (National Hurricane Center).\n`;
    firstMsg += `3) **Clean Transitions:** When a new day starts, Weathercast drops a fresh dashboard and unstickies and locks the previous day's post to keep conversation focused.\n\n`;

    /* DEFAULTS & NOTIFICATIONS */
    firstMsg += `**What Weathercast tracks:**\n\n\n`;
    firstMsg += `- **Convective Outlooks & History**\n`;
    firstMsg += `- **Active Mesoscale Discussions**\n`;
    firstMsg += `- **Live Tropical Cyclones** (Winds, Pressure, Movement, and Location)\n`;
    firstMsg += `- **Current Convective Watches**\n\n`;

    /* CONFIG LINKS */
    firstMsg += `**Configure now:** Manage any subreddit-specific settings here → `;
    firstMsg += `[Weathercast settings](https://developers.reddit.com/r/${subreddit.name}/apps/weathercast)\n\n`;

    /* FOOTER */
    firstMsg += `[Terms & Conditions](https://www.reddit.com/r/NovrixApps/wiki/weathercast/terms-and-conditions) | `;
    firstMsg += `[Privacy Policy](https://www.reddit.com/r/NovrixApps/wiki/weathercast/privacy-policy/) | `;
    firstMsg += `[Contact](https://www.reddit.com/r/NovrixApps/)\n\n`;

    await reddit.sendPrivateMessageAsSubreddit({
      fromSubredditName: subreddit.name,
      to: "weathercast",
      subject: `Thanks for installing Weathercast!`,
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
    console.error("Crash prevented in AppInstall trigger:", error);
    return c.json({ success: false, error: String(error) }); 
  }
};