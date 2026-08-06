export async function fetchDay1Outlook() {
    const headers = { 'User-Agent': 'WeathercastBot/1.0 (Reddit Devvit)' };

    // ==========================================
    // 1. CLOCK SYNC
    // ==========================================
    const nowUtc = Date.now();
    const shiftedTime = new Date(nowUtc - 12 * 60 * 60 * 1000);
    const targetSpcDay = `${shiftedTime.getUTCFullYear()}-${shiftedTime.getUTCMonth()}-${shiftedTime.getUTCDate()}`;

    // ==========================================
    // 2. FETCH MAIN OUTLOOK TEXT
    // ==========================================
    const listResponse = await fetch('https://api.weather.gov/products/types/SWO', { headers });
    const listData = await listResponse.json() as any;

    if (!listData['@graph'] || listData['@graph'].length === 0) return null;

    const day1Outlooks = listData['@graph']
        .filter((p: any) => p.wmoCollectiveId === 'ACUS01')
        .sort((a: any, b: any) => 
            new Date(a.issuanceTime).getTime() - new Date(b.issuanceTime).getTime()
        );
    
    if (day1Outlooks.length === 0) return null;

    const currentProduct = day1Outlooks[day1Outlooks.length - 1];
    const textResponse = await fetch(currentProduct['@id'], { headers });
    const textData = await textResponse.json() as any;

    // ==========================================
    // 3. BUILD OUTLOOK HISTORY
    // ==========================================
    const todaysOutlooks = day1Outlooks.filter((p: any) => {
        const pd = new Date(p.issuanceTime);
        pd.setTime(pd.getTime() - 4 * 60 * 60 * 1000); 
        const productSpcDay = `${pd.getUTCFullYear()}-${pd.getUTCMonth()}-${pd.getUTCDate()}`;
        return productSpcDay === targetSpcDay;
    });

    const outlookMap = new Map<string, any>();
    
    for (const p of todaysOutlooks) {
        const d = new Date(p.issuanceTime);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        
        const shiftedD = new Date(d.getTime() - 4 * 60 * 60 * 1000);
        const totalMinutes = shiftedD.getUTCHours() * 60 + shiftedD.getUTCMinutes();
        
        const issuanceBuckets = [
            { time: '0600', fileId: '1200', shiftedMins: 120 },
            { time: '1300', fileId: '1300', shiftedMins: 540 },
            { time: '1630', fileId: '1630', shiftedMins: 750 },
            { time: '2000', fileId: '2000', shiftedMins: 960 },
            { time: '0100', fileId: '0100', shiftedMins: 1260 }
        ];
        
        let closest = issuanceBuckets[0];
        let minDiff = Math.abs(totalMinutes - closest.shiftedMins);
        for (const bucket of issuanceBuckets) {
            const diff = Math.abs(totalMinutes - bucket.shiftedMins);
            if (diff < minDiff) {
                closest = bucket;
                minDiff = diff;
            }
        }
        
        const archiveUrl = `https://www.spc.noaa.gov/products/outlook/archive/${year}/day1otlk_${year}${month}${day}_${closest.fileId}.html`;
        
        outlookMap.set(closest.time, {
            title: `Day 1 Convective Outlook (${closest.time} UTC)`,
            url: archiveUrl,
            shiftedMins: closest.shiftedMins
        });
    }
    
    const outlookHistory = Array.from(outlookMap.values()).sort((a, b) => a.shiftedMins - b.shiftedMins);
    
    const previousOutlooks = outlookHistory.slice(0, -1);
    const currentOutlookLink = outlookHistory.length > 0 ? outlookHistory[outlookHistory.length - 1] : null;

    if (currentOutlookLink) {
        currentOutlookLink.url = 'https://www.spc.noaa.gov/products/outlook/day1otlk.html';
    }

    // ==========================================
    // 4. FETCH MESOSCALE DISCUSSIONS
    // ==========================================
    const activeMDs: { title: string, url: string, time: number }[] = [];
    
    try {
        const rssResponse = await fetch('https://www.spc.noaa.gov/products/spcmdrss.xml', { headers });
        const rssText = await rssResponse.text();
        
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let itemMatch;
        
        while ((itemMatch = itemRegex.exec(rssText)) !== null) {
            const itemBlock = itemMatch[1];
            
            const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || itemBlock.match(/<title>(.*?)<\/title>/i);
            const linkMatch = itemBlock.match(/<link>(.*?)<\/link>/i);
            
            if (titleMatch && linkMatch) {
                const rawTitle = titleMatch[1];
                const url = linkMatch[1];
                
                const mdNumMatch = rawTitle.match(/(?:Mesoscale (?:Precipitation )?Discussion|SPC MD)\s+(\d+)/i);
                if (mdNumMatch) {
                    activeMDs.push({
                        title: `Mesoscale Discussion ${mdNumMatch[1]}`,
                        url: url.trim(),
                        time: 0
                    });
                }
            }
        }
    } catch (err) {
        console.error("Error fetching SPC MD RSS:", err);
    }

    // ==========================================
    // 5. ASSEMBLE PAYLOAD
    // ==========================================
    return {
        timestamp: textData.issuanceTime,
        text: textData.productText,
        activeMDs,
        previousOutlooks,
        currentOutlookLink
    };
}