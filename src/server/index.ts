import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort, reddit } from '@devvit/web/server';
import { fetchDay1Outlook } from './spcParser.js';
import { fetchTropicalData } from './nhcParser.js';

const app = new Hono();

app.post('/internal/weather-update', async (c) => {
    try {
        const [outlook, tropical] = await Promise.all([
            fetchDay1Outlook(),
            fetchTropicalData()
        ]);

        if (!outlook) return c.json({ status: 'no_data' });

        const subreddit = await reddit.getCurrentSubreddit();
        
        // ==========================================
        // 1. GENERATE METEOROLOGICAL DATE 
        // ==========================================
        const nowUtc = Date.now();
        const shiftedTime = new Date(nowUtc - 12 * 60 * 60 * 1000);
        
        const dateString = shiftedTime.toLocaleDateString('en-US', { 
            timeZone: 'UTC',
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const targetTitle = `Severe Weather & Tropical Dashboard - ${dateString}`;

        // Check for existing daily post
        const existingPosts = await reddit.getNewPosts({
            subredditName: subreddit.name,
            limit: 15,
        }).all();

        const currentDailyPost = existingPosts.find(p => p.title === targetTitle);

        // ==========================================
        // 3. MESOSCALE DISCUSSIONS
        // ==========================================
        let allMDs = [...outlook.activeMDs];

        if (currentDailyPost && currentDailyPost.body) {
            const existingMdRegex = /\* \[(.*?Mesoscale Discussion \d+)\]\((.*?)\)/g;
            let match;
            
            while ((match = existingMdRegex.exec(currentDailyPost.body)) !== null) {
                const existingTitle = match[1];
                const existingUrl = match[2];
                
                if (!allMDs.some(md => md.url === existingUrl)) {
                    allMDs.push({ title: existingTitle, url: existingUrl, time: 0 });
                }
            }
        }

        // Sort the MD list numerically
        const sortedMDs = allMDs.map(md => {
            const numMatch = md.title.match(/\d+/); 
            const num = numMatch ? parseInt(numMatch[0], 10) : 0;
            return { ...md, num };
        }).sort((a, b) => a.num - b.num);

        const mdLinksText = sortedMDs.length > 0 
            ? sortedMDs.map(md => `* [${md.title}](${md.url})`).join('\n')
            : "* *No Mesoscale Discussions issued yet today.*";

        // ==========================================
        // 4. OUTLOOK HISTORY
        // ==========================================
        const previousOutlooksText = outlook.previousOutlooks.length > 0
            ? outlook.previousOutlooks.map((o: any) => `* [Previous ${o.title}](${o.url})`).join('\n')
            : "* *No previous outlooks today.*";
        
        const currentOutlookLinkText = outlook.currentOutlookLink
            ? `* **[Current ${outlook.currentOutlookLink.title}](${outlook.currentOutlookLink.url})**`
            : "";

        // ==========================================
        // 5. TROPICAL DATA
        // ==========================================
        let tropicalStormsText = "There are currently no active tropical cyclones.";
        if (tropical.hasActiveStorms) {
            tropicalStormsText = tropical.storms.map((storm: any) => 
                `**${storm.name}**\n* **Maximum Sustained Winds:** ${storm.winds}\n* **Minimum Central Pressure:** ${storm.pressure}\n* **Current Movement:** ${storm.movement}\n* **Location:** ${storm.location}`
            ).join('\n\n');
        }

        // ==========================================
        // 6. ASSEMBLE MARKDOWN OUTPUT
        // ==========================================
        const postBody = `
## 📡 Active Severe Weather Links
* [Current Convective Watches](https://www.spc.noaa.gov/products/watch/)
* [Current Mesoscale Discussions](https://www.spc.noaa.gov/products/md/)
* [Thunderstorm Outlook](https://www.spc.noaa.gov/products/exper/enhtstm/)
* [Day 1 Convective Outlook](https://www.spc.noaa.gov/products/outlook/day1otlk.html)
* [Day 2 Convective Outlook](https://www.spc.noaa.gov/products/outlook/day2otlk.html)
* [Day 3 Severe Thunderstorm Outlook](https://www.spc.noaa.gov/products/outlook/day3otlk.html)
* [Day 4-8 Severe Weather Outlook](https://www.spc.noaa.gov/products/exper/day4-8/)

---

## 🕒 Today's Outlook History
${previousOutlooksText}
${currentOutlookLinkText}

**Active Mesoscale Discussions:**
${mdLinksText}

---

## 📝 Current Severe Weather Outlook
*(Issued: ${outlook.timestamp} UTC)*

\`\`\`text
${outlook.text}
\`\`\`

---

## 🌀 Active Tropical Weather Links
* [National Hurricane Center](https://www.nhc.noaa.gov/)
* [Atlantic 7-Day Outlook](https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7)
* [Eastern Pacific 7-Day Outlook](https://www.nhc.noaa.gov/gtwo.php?basin=epac&fdays=7)

---

## 🌊 Tropical Weather Outlook
\`\`\`text
${tropical.outlookText}
\`\`\`

---

## ⚠️ Active Tropical Cyclones
${tropicalStormsText}

---
*This dashboard updates automatically every 15 minutes with live data from the NWS/SPC and NHC.*
        `;

        // ==========================================
        // 7. POST LIFECYCLE
        // ==========================================
        if (currentDailyPost) {
            await currentDailyPost.edit({ text: postBody });
            console.log(`Daily Dashboard (${dateString}) updated with latest data.`);
        } else {
            console.log(`New day detected. Starting reset process for: ${dateString}`);

            const oldStickyPost = existingPosts.find(p => 
                p.title.startsWith('Severe Weather & Tropical Dashboard') && 
                p.title !== targetTitle
            );
            
            if (oldStickyPost) {
                try {
                    await oldStickyPost.unsticky();
                    console.log(`Successfully unstickied old thread: ${oldStickyPost.id}`);
                } catch (stickyError) {
                    console.log('Could not remove sticky from old post, skipping...', stickyError);
                }
            }

            const newPost = await reddit.submitPost({
                subredditName: subreddit.name,
                title: targetTitle,
                text: postBody,
            });

            await newPost.sticky();
            await newPost.lock();
            console.log(`Successfully created, pinned, and locked new Daily Dashboard: ${newPost.id}`);
        }

        return c.json({ status: 'success' });
    } catch (error) {
        console.error('Error during update loop:', error);
        return c.json({ status: 'error' }, 500);
    }
});

serve({
    fetch: app.fetch,
    createServer,
    port: getServerPort(),
});