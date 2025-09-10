# Neopixels-Data-Visualizer: Activity Visualizer and Lab-Order Monitor

This project is a Node.js toolkit that does two related things:

1. **Pulls operational data from SAP HANA or a local JSON feed, classifies order activity, and emits “pulses” to a light display** using Open Pixel Control. This is useful for real time operations dashboards and team-room visualizations. &#x20;

2. **Accepts lab order IDs, queries a SOAP service for result details, calculates SDMA metrics by species, and forwards an aggregate to a downstream service** for monitoring. A shell script can stress the service with sample traffic. &#x20;

## Architecture

### 1) Online orders pipeline and pulse output

* **Data acquisition**
  The `Client.js` module is configured to call an SAP OData endpoint with basic auth and a date/time filter, returning JSON in `$format=json`. It uses `node-rest-client`.&#x20;

* **Local JSON fallback and service wrapper**
  `services.js` exposes a small Express service, `GET /service/getsapdata`, which returns the contents of `online_Orders.json`. This can be used for local dev or as a cache layer. Logging is written via `logger.js`. &#x20;

* **Classification and activity map**
  `jsonParser1.js` consumes the JSON payload from a local module named `parent_Copy` and builds a `Map` of order “type” to “quantity”. Types are derived from `MatDivision` and include `refLab`, `IHD_Orders`, `VSS`, or `other`. The activity map drives pulse behavior.&#x20;

* **Pulse server**
  `pulseTest.js` starts an Express server on port 8088. The route `GET /Online_Orders/:type` invokes `pulse.sendPulse(type)` to trigger a visual event, then does a `startup` and a “clean slate” on boot. A `urlTrimmer` helper appears to compute a rotating endpoint string for internal use.&#x20;

* **LED control primitives**
  `opc.js` is a Node Open Pixel Control client that maintains a pixel buffer and writes RGB values over TCP to an OPC server. This file includes helpers such as `setPixelCount`, `setPixel`, and `mapPixels`. The project also includes `tinycolor.js`, a color utility used by visualizers. &#x20;

* **Logging**
  `logger.js` implements leveled logging to console and a rotating `log.txt`, renaming the file when it exceeds 5 MB.&#x20;

### 2) Lab order SOAP pipeline and SDMA rollups

* **Parent HTTP server**
  `serverParent (2).js` runs an Express server on port 8080.

  * `GET /order/:orderid/:context` responds with a simple JSON status and increments a `totalCount`. It then calls a SOAP service to fetch lab order details.&#x20;
  * `GET /service/getsdma` returns aggregate SDMA counts for dog, cat, and other species, including thresholds that mark “bad” SDMA when `value > 14`.&#x20;

* **SOAP integration**
  `makeSoapCall` creates a SOAP client with relaxed TLS and calls `getLabOrderDetails`. The callback inspects nested collections and results, looking for `assay.code == 'SDMA'`. It converts `CANINE` and `FELINE` to `dog` and `cat`, then forwards an event to `http://localhost:8081/species/:species/:isSdma/:isSdmaBad`.&#x20;

* **Traffic generator**
  `llopTest1.sh` is a stress loop that repeatedly curls example order endpoints for several “types”. This is helpful for exercising the pipeline in development.&#x20;

## What the project does

* **Turns operational JSON into live visual pulses**
  Orders are categorized by type and quantity, then translated into pulses sent to an OPC-driven light display. This provides a real time at-a-glance indicator of activity, such as spikes in `RefLab` or `VSS` orders. &#x20;

* **Monitors lab order results and summarizes SDMA**
  When an order id is received, the service fetches lab details via SOAP, extracts SDMA results, rolls them up by species, and posts a compact signal to a downstream consumer for dashboards or alerting. A status endpoint exposes counters.&#x20;

## Repository layout

```
Client.js                 # SAP OData client for remote JSON feed
jsonParser1.js            # Extracts type and quantity from JSON into a Map
logger.js                 # Leveled logger with simple log rotation
opc.js                    # Open Pixel Control client for LED output
pulseTest.js              # Pulse HTTP server, triggers sendPulse by type
tinycolor.js              # Color utilities used by visualizers
Test_Original.js          # Legacy test harness that boots pulse server and client
services.js               # Local service wrapper returning online_Orders.json
serverParent (2).js       # Parent server with /order and /service/getsdma routes
llopTest1.sh              # Stress script that curls order endpoints
```

Key references:        &#x20;

## Getting started

### Prerequisites

* Node.js 14 or later
* An **OPC server** or compatible LED simulator running and reachable by TCP for visual output. `opc.js` writes to the configured host and port.&#x20;
* If exercising the SAP flow, valid credentials and endpoint for the OData service. `Client.js` expects basic auth and a filtered URL.&#x20;
* If exercising the SOAP flow, update the WSDL URL and downstream `urlDef`.&#x20;

### Install

```bash
npm install
```

Add or confirm dependencies in `package.json` for:

* express, request, soap, node-rest-client
* any pulse specific modules you use
* optional: array (if used), though native arrays are standard now

### Configure

* **OData**: Set `options_auth` and `endpoint` in `Client.js`. The code appends `&$format=json` to the URL.&#x20;
* **SOAP**: Set `wsdl` and `urlDef` in `serverParent (2).js`. `urlDef` is the downstream receiver for species and SDMA flags.&#x20;
* **Pulse server**: Confirm port 8088 and ensure your `pulse` module is present with `sendPulse`, `startup`, and `cleanSlate`.&#x20;
* **Local data**: Place `online_Orders.json` in the root or adjust `sapdatajsonfile` in `services.js`.&#x20;
* **Logging**: `logger.js` writes to `log.txt` and rotates over 5 MB.&#x20;

## Running the services

### A) Online orders to pulse

1. Start the JSON service wrapper

```bash
node services.js
```

This listens on `http://localhost:8080/service/getsapdata` and returns the raw JSON file.&#x20;

2. Start the pulse server

```bash
node pulseTest.js
```

This listens on `http://localhost:8088`. On startup it invokes `cleanSlate` twice and `startup`, then accepts `GET /Online_Orders/:type`.&#x20;

3. Trigger a pulse

```bash
curl http://localhost:8088/Online_Orders/RefLab
```

Replace `RefLab` with `IHD_Orders`, `VSS`, or `other` to simulate different activity types. &#x20;

### B) Lab order SOAP and SDMA rollups

1. Start the parent server

```bash
node "serverParent (2).js"
```

This listens on `http://localhost:8080`. Routes:

* `GET /order/:orderid/:context` kicks off the SOAP lookup for that order id and logs metrics.
* `GET /service/getsdma` returns aggregate counters for the current hour window.&#x20;

2. Drive traffic

```bash
bash llopTest1.sh
```

This repeatedly curls representative order types against port 8080. Edit the script to adjust volume and targets.&#x20;

3. Check counters

```bash
curl http://localhost:8080/service/getsdma
```

Returns totals for dog, cat, and other, plus flags for counts that exceeded the SDMA threshold.&#x20;

## How the pulse visualization works

* The pulse API receives a type, then the pulse module maps the type and quantity to one or more colors and intensities.
* The OPC client writes an RGB buffer to the LED controller using `setPixelCount`, `setPixel`, and `writePixels`. Any visual animation loop should call `mapPixels` or `mapParticles` at an interval.&#x20;
* Color math can use `tinycolor` to generate palettes or evaluate contrast for legibility.&#x20;

## Operations and logging

* All services log to stdout and append CSV style lines to `log.txt`. When the file exceeds 5 MB, it is renamed to `log.txt.old` and a new file is created. Log level checks gate writes.&#x20;

## Extending and hardening

* **Replace the `parent_Copy` JSON source** in `jsonParser1.js` with `services.js` or the OData client to unify data flow. &#x20;
* **Parameterize ports and URLs** using environment variables so dev, QA, and prod share the same code paths.
* **Add validation** on all inbound routes and handle null or malformed payloads in the SOAP callback where nested arrays may be sparse.&#x20;
* **Containerize** each service and the OPC sender for reproducible deploys.
* **Security**: store credentials outside the repo and enable TLS where applicable.

## Quick FAQ

* **Do I need SAP or SOAP access to try it**
  No. You can start with `services.js` and a local `online_Orders.json` to exercise parsing and pulses. The SOAP path can be mocked by returning a canned response to the callback.&#x20;

* **What if I do not have an LED wall**
  Run an OPC simulator or stub `opc.writePixels` with console output to verify buffers are produced. The API in `opc.js` is already isolated.&#x20;

## License and attribution

* The Open Pixel Control client comes from Micah Elizabeth Scott and is released to the public domain, as noted in the file header.&#x20;
* TinyColor is MIT licensed by Brian Grinstead.&#x20;
* This project is MIT License, please contribute
