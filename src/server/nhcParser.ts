export async function fetchTropicalData() {
    const headers = { 'User-Agent': 'WeathercastBot/1.0 (Reddit Devvit)' };

    // =================================================================
    // 1. FETCH TROPICAL WEATHER OUTLOOK
    // =================================================================
    const twoResponse = await fetch('https://api.weather.gov/products/types/TWO', { headers });
    const twoList = await twoResponse.json() as any;

    const latestTWO = twoList['@graph']
        ?.filter((p: any) => p.issuingOffice === 'KNHC' && p.wmoCollectiveId === 'ABNT20')
        .sort((a: any, b: any) => new Date(b.issuanceTime).getTime() - new Date(a.issuanceTime).getTime())[0];

    let outlookText = "No Tropical Weather Outlook data currently available.";
    if (latestTWO) {
        const twoTextResponse = await fetch(latestTWO['@id'], { headers });
        const twoData = await twoTextResponse.json() as any;
        
        const splitText = twoData.productText.split('Tropical Weather Outlook');
        if (splitText.length > 1) {
             outlookText = splitText[1].trim();
        } else {
             outlookText = twoData.productText;
        }
    }

    // =================================================================
    // 2. FETCH ACTIVE TROPICAL CYCLONES
    // =================================================================
    const tcpResponse = await fetch('https://api.weather.gov/products/types/TCP', { headers });
    const tcpList = await tcpResponse.json() as any;

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const recentTCPs = tcpList['@graph']
        ?.filter((p: any) => p.issuingOffice === 'KNHC' && new Date(p.issuanceTime) > twelveHoursAgo)
        .sort((a: any, b: any) => new Date(b.issuanceTime).getTime() - new Date(a.issuanceTime).getTime());

    const activeStorms: any[] = [];
    const seenWmoIds = new Set();

    if (recentTCPs && recentTCPs.length > 0) {
        for (const tcp of recentTCPs) {
            if (seenWmoIds.has(tcp.wmoCollectiveId)) continue;
            seenWmoIds.add(tcp.wmoCollectiveId);

            const tcpTextResponse = await fetch(tcp['@id'], { headers });
            const tcpData = await tcpTextResponse.json() as any;
            const text = tcpData.productText;

            const nameMatch = text.match(/(?:Hurricane|Tropical Storm|Tropical Depression)\s+([A-Z\s]+)\s+Advisory/i);
            const locationMatch = text.match(/LOCATION\.\.\.(\d+\.\d+[NS]\s+\d+\.\d+[EW])/);
            const windsMatch = text.match(/MAXIMUM SUSTAINED WINDS\.\.\.(\d+\s*MPH)/);
            const movementMatch = text.match(/PRESENT MOVEMENT\.\.\.([A-Z]+\s+OR\s+\d+\s+DEGREES\s+AT\s+\d+\s*MPH)/);
            const pressureMatch = text.match(/MINIMUM CENTRAL PRESSURE\.\.\.(\d+\s*MB)/);

            if (nameMatch) {
                activeStorms.push({
                    name: nameMatch[0].trim(),
                    location: locationMatch ? locationMatch[1] : "Unknown",
                    winds: windsMatch ? windsMatch[1] : "Unknown",
                    movement: movementMatch ? movementMatch[1] : "Unknown",
                    pressure: pressureMatch ? pressureMatch[1] : "Unknown",
                });
            }
        }
    }

    // =================================================================
    // 3. RETURN CONSOLIDATED TROPICAL DATA
    // =================================================================
    return {
        hasActiveStorms: activeStorms.length > 0,
        outlookText: outlookText,
        storms: activeStorms
    };
}