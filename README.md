# Jom Cakap: putting it on the iPad

This folder is the whole app: `index.html` and two icon files. It has no server and no build step, and it needs no account.

## Publish it on GitHub Pages (free, about 10 minutes, once)

1. Go to **github.com** and create a free account if you don't have one.
2. Click **+** (top right), then **New repository**.
   - Name: `jom-cakap` (any name works)
   - Choose **Public**. Free GitHub Pages needs a public repository. Anyone with the link could open the app, but no personal data is stored in these files.
   - Click **Create repository**.
3. On the new repository page, click **uploading an existing file**. Drag in `index.html`, `apple-touch-icon.png` and `favicon.png`, then click **Commit changes**.
4. Open **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, then click **Save**.
5. Wait a minute and refresh the page. GitHub shows your address, for example
   `https://YOUR-USERNAME.github.io/jom-cakap/`

## On the iPad

1. Open that address in **Safari**.
2. Tap **Share → Add to Home Screen**. You now have a Jom Cakap icon.
3. Open the **Parent corner (👪)**:
   - Fill in his name and family.
   - **Sound check:** if no Malay voice is found, go to Settings → Accessibility → Spoken Content → Voices → **Malay** and download it.
   - **Listening & pronunciation:** run the **mic test** and tap **Allow** when Safari asks for the microphone.
4. If listening doesn't work:
   - Turn on **Settings → General → Keyboard → Enable Dictation**.
   - If the test reports the speech service isn't allowed, also turn on **Siri**.
   - If it hears English instead of Malay, add a **Malay keyboard**, so Malay dictation is available.
   - If it works in Safari but not from the Home Screen icon, use Safari.
   - If it records but never scores, set *Listening mode* to **Listen only**.

## How the scoring works

When he taps 🎤 and speaks, Safari's built-in speech recognition (set to Malay) writes down what it heard. The app then compares that, word by word, with the sentence he was meant to say:

- **green:** clearly understood
- **amber:** nearly (for example, it heard "adek" for "adik")
- **red:** not heard

Stars: 3 is 90%+, 2 is 70%+, 1 is 40%+.

The app also records him, so you can tap **▶ Suara saya** (my voice) and compare it with **🔊 Contoh** (the example).

The score tells you whether the iPad understood him. It is not a precise accent grade, and that's the step Azure would add later.

## Saving progress

Progress lives in Safari on that iPad. Use **Parent corner → Data → Save backup file** now and then; it goes to the Files app. **Restore from backup** brings it back on a new device or after clearing Safari.

## Updating the app

When there is a new version, open your repository on GitHub, click **Add file → Upload files**, drop in the new `index.html` and commit. The iPad picks it up the next time the app is opened. If it doesn't, pull down to refresh.

## Later: Azure pronunciation scores

`index.html` has `PRON_CONFIG={azureUrl:''}` near the start of the listening code. Once a small helper (an Azure Function holding your Azure Speech key) is set up, putting its address there makes the app send each recording for per-sound scoring. That replaces the basic score, and nothing else needs to change.

The helper must:

- accept a POST with the audio (Safari records `audio/mp4`; the helper converts it to 16 kHz WAV for Azure),
- read the query parameters `?text=…&lang=ms-MY`,
- reply with `{stars, words:[{w, status:"ok"|"near"|"miss"}], heard}`.

Before building it, check Microsoft's *Language support → Pronunciation assessment* list for **ms-MY**.
