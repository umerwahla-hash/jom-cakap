# Azure pronunciation scoring: step by step

Without Azure, the app checks whether the iPad *understood* him. With Azure, each word, and each sound inside it, gets an accuracy score out of 100, plus fluency and completeness scores.

There are three Azure pieces:

1. **Speech resource:** Microsoft's speech service. It does the scoring.
2. **Function App:** a tiny helper (the `azure-function` folder in this repo). It keeps your Speech key secret and turns Azure's reply into stars and coloured words.
3. **The app:** you paste the helper's address into the Parent corner on the iPad.

Allow about 30–45 minutes the first time.

---

## Step 0: Check that Malay is supported (5 min, do this first)

Microsoft doesn't support pronunciation assessment for every language, and I couldn't confirm Malay from their docs.

1. Go to **https://speech.microsoft.com** (Speech Studio) and sign in with a Microsoft account. You'll create the Azure account in Step 1, so you can do Step 1 first if it asks for one.
2. Open **Pronunciation assessment**.
3. Open the **Language** list. Look for **Malay (Malaysia)**, which is `ms-MY`.
   - **If it's there:** continue. You can also type "Saya sayang keluarga saya", record yourself and see the scores.
   - **If it's not there:** stop here. The free on-iPad scoring keeps working. Tell me, and I'll look at another scoring service.

## Step 1: Create an Azure account (10 min)

1. Go to **https://azure.microsoft.com/free** and choose **Start free**.
2. Sign in with a Microsoft account, or create one, and complete the sign-up. A card is needed for identity checks. You stay on free tiers unless you upgrade.

## Step 2: Create the Speech resource (5 min)

1. Go to **https://portal.azure.com**.
2. Search the top bar for **Speech services**, then click **+ Create**.
3. Fill in:
   - **Subscription:** your subscription
   - **Resource group:** click *Create new* and type `jomcakap`
   - **Region:** **Southeast Asia** (the closest to Singapore)
   - **Name:** `jomcakap-speech`, or any unique name
   - **Pricing tier:** **Free F0** (free monthly allowance; enough for daily practice by one child)
4. Click **Review + create**, then **Create**, and wait for it to finish. Click **Go to resource**.
5. In the left menu, open **Keys and Endpoint** (under *Resource Management*). Copy **KEY 1** and note the **Location/Region**: `southeastasia`.
   Keep the key private. Never paste it into the app or into GitHub.

## Step 3: Create the Function App (10 min)

1. In the portal, search for **Function App**, then click **+ Create**.
2. Choose **Flex Consumption** (serverless; you pay only when it runs, with a monthly free grant), then click **Select**.
3. Fill in:
   - **Resource group:** `jomcakap`
   - **Function App name:** for example `jomcakap-score-umer`. It must be unique worldwide, and it becomes `https://jomcakap-score-umer.azurewebsites.net` or similar.
   - **Region:** **Southeast Asia**
   - **Runtime stack:** **Node.js**
   - **Version:** **20** or **22**
4. Leave the other tabs at their defaults. Click **Review + create**, then **Create**, then **Go to resource**.

## Step 4: Give the helper your Speech key (3 min)

1. In the Function App, open **Settings → Environment variables**. On some screens this is called *Configuration → Application settings*.
2. Click **+ Add**:
   - Name `SPEECH_KEY`, value: KEY 1 from Step 2
3. Click **+ Add** again:
   - Name `SPEECH_REGION`, value `southeastasia`
4. Click **Apply**, then **Confirm**. The app restarts.

## Step 5: Allow the app's website to call the helper (CORS) (2 min)

1. In the Function App, open **API → CORS**.
2. Under **Allowed Origins**, add: `https://umerwahla-hash.github.io`
3. Click **Save**.

## Step 6: Put the helper code on Azure (10 min)

The code is already in the `azure-function` folder of the `jom-cakap` GitHub repository.

**Option A: from the portal, with nothing to install (recommended)**

1. In the Function App, open **Deployment → Deployment Center**.
2. **Source:** **GitHub**. Sign in to GitHub when asked and authorise Azure.
3. **Organization:** `umerwahla-hash` · **Repository:** `jom-cakap` · **Branch:** `main`.
4. Leave the authentication setting at its default (user-assigned identity). Click **Save**.
   Azure adds a workflow file to your repository, under `.github/workflows/`, and starts a deployment.
5. That first deployment looks in the wrong folder, because the helper lives in `azure-function/`. Fix it once:
   1. On GitHub, open the repository, then `.github/workflows/`, then the new `.yml` file, then click the ✏️ pencil.
   2. Find the line `AZURE_FUNCTIONAPP_PACKAGE_PATH: '.'`.
   3. Change it to `AZURE_FUNCTIONAPP_PACKAGE_PATH: 'azure-function'`.
   4. Click **Commit changes**.
6. Open the **Actions** tab on GitHub and wait for the run to go green (about 2–3 minutes).

**Option B: from a Mac terminal**

```bash
brew install azure-cli
brew tap azure/functions && brew install azure-functions-core-tools@4
az login
git clone https://github.com/umerwahla-hash/jom-cakap.git
cd jom-cakap/azure-function
npm install
func azure functionapp publish jomcakap-score-umer   # your Function App name
```

## Step 7: Copy the helper's address (2 min)

1. In the Function App's **Overview**, scroll to the functions list and click **score**.
2. Click **Get function URL**, then copy the **default (function key)** URL. It looks like:
   `https://jomcakap-score-umer.azurewebsites.net/api/score?code=AbC123…`
   The `code=` part is a password for the helper. Only paste it into the app on the iPad.

## Step 8: Switch it on in the app (2 min)

1. On the iPad, open Jom Cakap, then **👪 Parent corner**, then **Listening & pronunciation**.
2. Paste the address into **Azure pronunciation scoring** and tap **Save**.
3. Run the **mic test**. You should briefly see "Cikgu sedang menyemak…", then stars, coloured words and the four Azure scores (*Sebutan, Ketepatan, Kelancaran, Kelengkapan*).
   - If it shows a warning that the Azure check failed, the basic iPad score was used instead. See *If something goes wrong* below.

---

## Costs (check the live pricing pages; these change)

- **Speech, Free F0:** includes a monthly allowance of free audio hours. Each attempt is a few seconds, so a child practising daily uses a small fraction of it. If the free tier runs out or is refused, you can switch to Standard S0, which is charged per hour of audio.
- **Functions, Flex Consumption:** has a monthly free grant; a few hundred calls a day is far below it.
- To avoid surprises, set a budget alert: portal → **Cost Management → Budgets → + Add** → for example SGD 5 per month, with an email alert.

## If something goes wrong

| What you see | Likely cause | Fix |
|---|---|---|
| "Azure check failed (score 401)" | Wrong or missing `code=` | Copy the function URL again (Step 7) |
| "…failed (score 500)" | `SPEECH_KEY` not set | Step 4, then restart the Function App |
| "…failed (score 502)" with detail 401 | Wrong Speech key or region | Re-check KEY 1 and `southeastasia` |
| "…failed (score 502)" with detail 400 | Malay not supported for assessment | See Step 0 |
| "…failed (Failed to fetch / Load failed)" | CORS | Step 5: the origin must be exactly `https://umerwahla-hash.github.io` |
| Always 0 stars | He spoke too quietly, or the recording is silent | Run the mic test, tap ▶ Suara saya and check his voice is there |

You can view the helper's logs at Function App → **score** → **Monitor** / **Logs**.

## How it works (for reference)

1. The app records him, converts the recording to 16 kHz WAV on the iPad, and POSTs it to `/api/score?text=<sentence>&lang=ms-MY`.
2. The helper calls Azure Speech's short-audio API with a `Pronunciation-Assessment` header (HundredMark scores, phoneme granularity, miscue detection).
3. The helper replies with `{stars, words:[{w, status, score}], heard, scores:{pron, accuracy, fluency, completeness}}`.

Stars: 3 for an overall score of 85 or more, 2 for 70+, 1 for 50+.
Each word: 80+ is green, 60–79 is amber, below 60 or skipped is red.
