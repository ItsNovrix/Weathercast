# 🌦️ Weathercast - Live Severe Weather Dashboard

Weathercast is a purpose-built app that automates posting a daily, live-updating national severe weather and tropical cyclone dashboard for weather-focused subreddits. It aggregates data directly from the National Weather Service (NWS), Storm Prediction Center (SPC), and National Hurricane Center (NHC) into a single, cohesive, persistent sticky thread.

---

## 🛠️ Features

* **Real-Time Dashboard:** Consolidates severe convective weather and tropical system tracking into a single daily stickied megathread post.
* **National Convective Outlook:** Automatically pulls `ACUS01` data from the Storm Prediction Center, offering a macro-level overview of severe thunderstorm and tornado risks across the entire lower 48 states.
* **Tropical System Tracking:**  Pulls NHC data (`ABNT20` and `TCP` products) to display maximum sustained winds, central pressure, location, and movement when a storm is active. When no tropical systems are present, this section simply collapses back to a single line.
* **Persistent Editing:** Weathercast runs on an automated cron cycle (every 15 minutes) to perform a clean text overwrite on the existing thread to avoid spamming a subreddit with multiple new posts.

---

## Fetch Domains

The following domains are requested for this app:

- `api.weather.gov` - Used to fetch real-time Convective Outlooks and Mesoscale Discussions data directly from the National Weather Service public API to add to weather outlook posts.

- `spc.noaa.gov` - Used to fetch real-time Mesoscale Discussions directly from the National Weather Service SPC RSS feed to add to weather outlook posts.
  - **Justification:** While Devvit already pre-approves `api.weather.gov`, which is used for portions of this app, that specific API does not provide critical information on Mesoscale Discussions, returning only blank data when there is active severe weather. Because Devvit's allowed API fails to properly access this specific product, it's necessary to pull the data directly from the official RSS feed on `spc.noaa.gov`.

---

## 🧾 Source & License

The source code for Weathercast is available on [GitHub](https://github.com/ItsNovrix/Weathercast).

This project is licensed under the [BSD-3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
This app was developed in compliance with [Reddit's Developer Terms](https://www.redditinc.com/policies/developer-terms) and adheres to the guidelines for the Devvit platform.

---

## 🚀 Changelog

* v0.0.1: Basic functionality implemented.
* v0.0.2: Corrected errors in post formatting.
* v0.0.3: Updated README.
* v0.0.4: Adjusted cron logic from daily to 15 minute intervals to enhance weather coverage.
* v0.0.5: Added automated sticky logic to post.
* v0.0.6: Updated post formatting.
* v0.0.7: Updated README.
* v0.0.8: Updated weather tracking from ACUS11 to ACUS01
* v0.0.9: Updated NWS/NHC links. Added NHC tropical system tracking.
* v0.0.10: Updated post formatting.
* v0.0.11: Updated posts to include previous SPC outlooks and mesoscale discussions. Updated bot to create new post daily for archival purposes.
* v0.0.12: Updated domain list to allowed domain.
* v0.0.13: Updated README.
* v0.0.14: Updated cron logic to adjust megathread post time. Updated previous SPC outlooks links.
* v0.0.15: Updated app to latest Devvit version.
* v0.0.16: Adjusted cron logic for megathread post time.
* v0.0.17: Updated domain list to resolve issues with Mesoscale Discussion fetching.
* v0.0.18: Updated SPC outlook links to address issue with duplicate links when corrections are issued.
* v0.0.19: Updated domain list to resolve issues with Mesoscale Discussion fetching.
* v0.0.20: Updated domain list to resolve issues with Mesoscale Discussion fetching.
* v0.0.21: Updated Mesoscale Discussion fetching method to address issues with Devvit domain approval.
* v0.0.22: Testing new Mesoscale Discussion fetching methods due to ongoing issues with Mesoscale Discussion fetches.
* v0.0.23: Testing new Mesoscale Discussion fetching methods due to ongoing issues with Mesoscale Discussion fetches.

---

## 🆘 Support

If you encounter any issues or have questions, please visit [r/NovrixApps](https://reddit.com/r/NovrixApps).

Thanks for using **Weathercast**!