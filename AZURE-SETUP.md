# Azure pronunciation scoring: how it's set up

The app can send each recording to a small Azure "helper", which returns a pronunciation score for each word and each sound. Without it, the app falls back to Safari's own speech recognition.

## What exists in Azure (set up 10 Oct 2026)

| Piece | Name | Details |
|---|---|---|
| Resource group | `jomcakap` | Southeast Asia, subscription "Azure subscription 1" (free trial) |
| Speech resource | `WahlaLanguageApp` | Free F0 tier. Malay (ms-MY) pronunciation assessment confirmed working |
| Function App | `jomcakap-score-umer` | Consumption plan, Windows, Node 22, Functions v4 |
| Storage | `jomcakapst…` | Required by the Function App |
| App settings | `SPEECH_KEY`, `SPEECH_REGION=southeastasia` | The key was set from the Azure CLI and never written down |
| CORS | `https://umerwahla-hash.github.io` | Lets the app call the helper |

The free trial doesn't allow the newer Flex Consumption plan. That's why the helper runs on the classic Consumption plan and was created from **Azure Cloud Shell** with the Azure CLI rather than the portal form.

## Connecting the iPad

1. In the Azure portal, open Function App **jomcakap-score-umer** → **Functions** → **score** → **Get function URL**, and copy the **default (function key)** URL.
2. On the iPad, open Jom Cakap → 👪 **Parent corner** → **Listening & pronunciation**, paste it into **Azure pronunciation scoring**, then tap **Save**.
3. Run the **mic test**. You should see four scores out of 100 under the stars.

Keep that URL off GitHub: the `code=` part is a password for the helper.

## Updating the helper code later

Open Cloud Shell (portal → `>_`) and run:

```bash
RG=jomcakap; FN=jomcakap-score-umer
cd ~ && rm -rf jc && git clone -q https://github.com/umerwahla-hash/jom-cakap jc
cd jc/azure-function && npm install --omit=dev && zip -qr ../fn.zip . -x '*.example' && cd ..
az functionapp deployment source config-zip -g $RG -n $FN --src fn.zip
```

## Scoring scale

Azure's Malay model is strict: in testing, a native Malay voice scored about 77 out of 100 overall.

**Stars**

| Stars | Overall score |
|---|---|
| ★★★ | 75 or more |
| ★★ | 60 or more |
| ★ | 40 or more |

**Word colours**

| Colour | Word score |
|---|---|
| Green | 70 or more |
| Amber | 45 or more |
| Red | below 45, or the word was skipped |

## Before the free trial ends

The trial credit expires about 30 days after sign-up. To keep the helper running after that, upgrade the subscription to Pay-As-You-Go: portal → Subscriptions → Upgrade. Expected cost is close to zero, because the Speech service stays on the free tier and the helper is well within the Functions free grant.

To avoid surprises, add a budget alert: portal → **Cost Management → Budgets**, for example SGD 5 per month with an email alert.

## If something goes wrong

| What the Parent corner shows | Likely cause | Fix |
|---|---|---|
| "Azure check failed (score 401)" | Wrong `code=` | Copy the function URL again |
| "…(score 502)" | Speech key or region problem | In Cloud Shell, re-set `SPEECH_KEY` from `az cognitiveservices account keys list` |
| "Failed to fetch / Load failed" | CORS | The allowed origin must be exactly `https://umerwahla-hash.github.io` |
