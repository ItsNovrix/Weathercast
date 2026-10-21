import type { Context } from 'hono';
import { reddit, settings } from '@devvit/web/server';
import { fetchDay1Outlook } from '../parsers/spcParser.js';
import { fetchTropicalData } from '../parsers/nhcParser.js';
import { checkForUpdates } from '../upgradeNotifier.js';

export const handleWeatherUpdateJob = async (c: Context) => {
    try {
        const [outlook, tropical] = await Promise.all([
            fetchDay1Outlook(),
            fetchTropicalData()
        ]);

        if (!outlook) return c.json({ status: 'no_data' });

        const subreddit = await reddit.getCurrentSubreddit();
        await checkForUpdates();
        
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
        const targetTitle = `Severe Weather Dashboard - ${dateString}`;

        // Check for existing daily post
        const existingPosts = await reddit.getNewPosts({
            subredditName: subreddit.name,
            limit: 15,
        }).all();

        const currentDailyPost = existingPosts.find(p => p.title === targetTitle);

        // ==========================================
        // 2. WATCHES & TORNADO RISK
        // ==========================================
        const watchLinksText = outlook.activeWatches && outlook.activeWatches.length > 0
            ? outlook.activeWatches.map((w: { title: string; url: string }) => `* [${w.title}](${w.url})`).join('\n')
            : "* *No active convective watches in effect at this time.*";

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
            : "* *No Mesoscale Discussions issued at this time.*";

        // ==========================================
        // 4. OUTLOOK HISTORY
        // ==========================================
        const previousOutlooksText = outlook.previousOutlooks.length > 0
            ? outlook.previousOutlooks.map((o: any) => `* [Previous ${o.title}](${o.url})`).join('\n')
            : "* *Previous outlooks not yet available.*";
        
        const currentOutlookLinkText = outlook.currentOutlookLink
            ? `* **[Current ${outlook.currentOutlookLink.title}](${outlook.currentOutlookLink.url})**`
            : "";

        // ==========================================
        // 5. TROPICAL DATA
        // ==========================================
        let tropicalStormsText = "There are currently no active tropical cyclones.";
        if (tropical.hasActiveStorms) {
            tropicalStormsText = tropical.storms.map((storm: any) => 
                `**${storm.name}**\n**Maximum Sustained Winds:** 
- ${storm.winds}\n**Minimum Central Pressure:** 
- ${storm.pressure}\n**Current Movement:** 
- ${storm.movement}\n**Location:** 
- ${storm.location}`
            ).join('\n\n');
        }

        // ==========================================
        // 6. ASSEMBLE MARKDOWN OUTPUT
        // ==========================================
        const showSevereLinks = (await settings.get('show_severe_links')) ?? true;
        const showWatches = (await settings.get('show_watches')) ?? true;
        const showOutlookHistory = (await settings.get('show_outlook_history')) ?? true;
        const showMds = (await settings.get('show_mds')) ?? true;
        const showSevereOutlook = (await settings.get('show_severe_outlook')) ?? true;
        const showTropicalLinks = (await settings.get('show_tropical_links')) ?? true;
        const showTropicalOutlook = (await settings.get('show_tropical_outlook')) ?? true;
        const showCyclones = (await settings.get('show_cyclones')) ?? true;

        const postSections: string[] = [];

        if (showSevereLinks) {
            postSections.push(`## 📡 Active Severe Weather Links\n- [Current Convective Watches](https://www.spc.noaa.gov/products/watch/)\n- [Current Mesoscale Discussions](https://www.spc.noaa.gov/products/md/)\n- [Thunderstorm Outlook](https://www.spc.noaa.gov/products/exper/enhtstm/)\n- [Day 1 Convective Outlook](https://www.spc.noaa.gov/products/outlook/day1otlk.html)\n- [Day 2 Convective Outlook](https://www.spc.noaa.gov/products/outlook/day2otlk.html)\n- [Day 3 Severe Thunderstorm Outlook](https://www.spc.noaa.gov/products/outlook/day3otlk.html)\n- [Day 4-8 Severe Weather Outlook](https://www.spc.noaa.gov/products/exper/day4-8/)`);
        }

        if (showWatches) {
            postSections.push(`## 🌪️ Active Watches & Tornado Risk\n**Maximum Day 1 Tornado Risk:** ${outlook.tornadoRisk}\n\n${watchLinksText}`);
        }

        const historyAndMdSection: string[] = [];
        if (showOutlookHistory) {
            historyAndMdSection.push(`## 🕒 Today's Outlook History\n${previousOutlooksText}\n${currentOutlookLinkText}`);
        }
        if (showMds) {
            historyAndMdSection.push(`## 🌩️ Active Mesoscale Discussions\n${mdLinksText}`);
        }
        if (historyAndMdSection.length > 0) {
            postSections.push(historyAndMdSection.join('\n\n'));
        }

        if (showSevereOutlook) {
            postSections.push(`## 📝 Current Severe Weather Outlook\n*(Issued: ${outlook.timestamp} UTC)*\n\n\`\`\`text\n${outlook.text}\n\`\`\``);
        }

        if (showTropicalLinks) {
            postSections.push(`## 🌀 Active Tropical Weather Links\n- [National Hurricane Center](https://www.nhc.noaa.gov/)\n- [Atlantic 7-Day Outlook](https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7)\n- [Eastern Pacific 7-Day Outlook](https://www.nhc.noaa.gov/gtwo.php?basin=epac&fdays=7)`);
        }

        if (showTropicalOutlook) {
            postSections.push(`## 🌊 Tropical Weather Outlook\n\`\`\`text\n${tropical.outlookText}\n\`\`\``);
        }

        if (showCyclones) {
            postSections.push(`## ⚠️ Active Tropical Cyclones\n${tropicalStormsText}`);
        }

        let postBody = postSections.join('\n\n---\n\n');
        
        if (postBody.length > 0) {
            postBody += '\n\n---\n';
        }
        postBody += '*This dashboard updates automatically every 15 minutes with live data from the NWS/SPC and NHC.*';

        // ==========================================
        // 7. POST LIFECYCLE
        // ==========================================
        if (currentDailyPost) {
            await currentDailyPost.edit({ text: postBody });
            console.log(`Daily Dashboard (${dateString}) updated with latest data.`);
        } else {
            console.log(`New day detected. Starting reset process for: ${dateString}`);

            const oldStickyPost = existingPosts.find(p => 
                p.title.startsWith('Severe Weather Dashboard') && 
                p.title !== targetTitle
            );
            
            if (oldStickyPost) {
                try {
                    await oldStickyPost.unsticky();
                    await oldStickyPost.lock();
                    console.log(`Successfully retired previous thread: ${oldStickyPost.id}`);
                } catch (stickyError) {
                    console.log('Could not retire previous post, skipping...', stickyError);
                }
            }

            const newPost = await reddit.submitPost({
                subredditName: subreddit.name,
                title: targetTitle,
                text: postBody,
            });

            await newPost.sticky();
            console.log(`Successfully created and pinned new Daily Dashboard: ${newPost.id}`);
        }

        return c.json({ status: 'success' });
    } catch (error) {
        console.error('Error during update loop:', error);
        return c.json({ status: 'error' }, 500);
    }
};