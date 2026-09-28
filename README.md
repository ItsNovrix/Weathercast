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

## 🆘 Feedback & Support

If you have any feedback/suggestions or need support, visit [r/NovrixApps](https://www.reddit.com/r/NovrixApps).

## 🚀 Changelog

**Latest Version:** v0.0.30

* Cleared dependency cache and rebuilt dependencies due to app install and version update failure.
* Updated app to latest Devvit version.

For the full changelog, please visit the Weathercast [GitHub](https://github.com/ItsNovrix/Weathercast).

---

Thanks for using **Weathercast**!