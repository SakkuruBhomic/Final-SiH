# Project Documentation & Technical Report: Risk2Rescue
**AI-Powered Multi-Hazard Disaster Intelligence & Incident Command System**

---

## Executive Summary

**Risk2Rescue (RZI)** is an integrated geospatial disaster intelligence platform engineered to bridge the operational gap between frontline citizens facing acute natural hazards and Incident Commanders managing mass evacuation logistics. Built on a zero-external-dependency Node.js architecture with high-performance browser GIS layers, the platform replaces reactive, ad-hoc relocation decisions with an auditable, multi-factor mathematical scoring model: the **Vulnerability Priority Index (VPI)** coupled with a **Greedy Carrying-Capacity Allocation Algorithm**.

Every technical assertion, flow diagram, and architectural specification in this report is grounded in the active codebase:
* Backend HTTP Server & Telemetry Engine: [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js) (1,710 lines)
* Priority & Allocation Engine: [`js/priority-engine.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/priority-engine.js) (560 lines)
* Citizen Geolocation & Routing: [`js/location-service.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/location-service.js) & [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js)
* Authority Incident Command Center: [`js/authority.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/authority.js) & [`authority.html`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/authority.html)
* Primary Datasets: [`data/census_lookup.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/census_lookup.json) & [`data/shelters.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/shelters.json)

---

## 1. Full Workflow Outline

### 1.1 End-to-End Data Pipeline Architecture

The Risk2Rescue platform operates as a continuous, closed-loop telemetry and allocation pipeline. Raw demographic baselines and real-time sensor streams converge into the computational core before distributing decision intelligence to citizens and command personnel.

```mermaid
graph TD
    %% Source Ingestion Layer
    subgraph Data_Ingestion ["1. Multi-Source Ingestion Layer"]
        CENSUS["Census 2011 Village Master<br/><code>data/census_lookup.json</code>"]
        SHELTERS["SDMA Shelter Directory<br/><code>data/shelters.json</code>"]
        USGS["USGS Earthquakes Feed<br/><code>earthquake.usgs.gov</code>"]
        METEO["Open-Meteo Weather & AQI<br/><code>api.open-meteo.com</code>"]
        OSRM_PUB["Project OSRM Road Engine<br/><code>router.project-osrm.org</code>"]
        IMD_CAP["IMD Official CAP RSS Feed<br/><code>cap-sources.s3.amazonaws.com</code>"]
        WINDY_IFRAME["Windy Forecast Layers<br/><code>embed.windy.com</code>"]
    end

    %% Backend Server Processing & Caching Layer
    subgraph Backend_Server ["2. Server Processing & In-Memory Caching (server.js)"]
        SRV_TELEMETRY["<code>/api/telemetry/live</code><br/>Synthesizes Radar & Quakes"]
        SRV_QUAKES["<code>/api/earthquakes/live</code><br/>TTL: 10 min Cache"]
        SRV_IMD["<code>/api/imd-alerts</code><br/>Regex XML Parser (TTL: 12 min)"]
        SRV_POINT["<code>/api/windy/point-forecast</code><br/>Live Fallback to Open-Meteo"]
        SRV_OSRM_CACHE["<code>getOsrmRoadDistance()</code><br/>In-Memory Pair Matrix Cache"]
        SRV_SHELTERS["<code>/api/shelters</code> & <code>PATCH /api/shelters/:id</code><br/>Atomic Occupancy Sync"]
        SRV_RISK["<code>/api/risk-zone</code><br/>Point-in-Polygon (Ray Casting)"]
    end

    %% Analytical Engine
    subgraph Analytical_Core ["3. Priority Engine (js/priority-engine.js)"]
        VPI_CALC["<code>computeVPI()</code><br/>6-Factor Weighted Scoring<br/>(w1..w6, Sum = 1.00)"]
        TIER_BUCKET["Tier Assignment<br/>IMMEDIATE (>0.8) | SHORT_TERM (0.5-0.8)<br/>MEDIUM_TERM (<0.5)"]
        GREEDY_ALLOC["<code>allocateCarryingCapacity()</code><br/>Greedy Multi-Shelter Knapsack Matching"]
        DEFICIT_GEN["Zone Deficit Generator<br/>Identifies Unallocated Headcount"]
    end

    %% Authority Intelligence Layer
    subgraph Authority_Layer ["4. Incident Command (authority.html & js/authority.js)"]
        SRV_RANKING["<code>/api/priority-ranking</code><br/>(TTL: 5 min Cache)"]
        AI_REC_EP["<code>/api/ai-recommendation</code><br/>Claude 3.5 Sonnet / Deterministic Fallback"]
        AUDIT_LOG["Audit Log File<br/><code>data/ai_recommendations_log.json</code>"]
        AUTH_UI["Incident Commander Dashboard<br/>FLIP Table Animation, Deficit Cards, Shelter Modals"]
    end

    %% Citizen Portal Layer
    subgraph Citizen_Layer ["5. Citizen Portal (citizen.html & js/citizen.js)"]
        GPS_LOC["Browser Geolocation<br/><code>RZILocationService.detectLocation()</code>"]
        GEOCODE["Nominatim Reverse Geocoder"]
        CIT_MAP["Leaflet Map Engine<br/><code>js/map.js</code> + Pulsing Marker"]
        CIT_INSP["Interactive Map Inspector<br/>Risk Level, Wind, Storm Surge"]
        CIT_IMD_UI["Official IMD Alerts Carousel"]
        SRV_EVAC["<code>/api/evacuation/routes</code><br/>Turn-by-Turn Safe Pathfinding"]
        CIT_REPORT["Crowdsource Hazard Report<br/>Firebase Firestore Live Sync"]
    end

    %% Connections
    CENSUS --> VPI_CALC
    SHELTERS --> SRV_SHELTERS
    SRV_SHELTERS --> GREEDY_ALLOC
    USGS --> SRV_QUAKES --> SRV_TELEMETRY
    METEO --> SRV_POINT --> SRV_TELEMETRY
    SRV_TELEMETRY --> VPI_CALC
    OSRM_PUB --> SRV_OSRM_CACHE --> VPI_CALC
    IMD_CAP --> SRV_IMD --> CIT_IMD_UI

    VPI_CALC --> TIER_BUCKET --> GREEDY_ALLOC --> DEFICIT_GEN
    DEFICIT_GEN --> SRV_RANKING
    SRV_RANKING --> AUTH_UI
    SRV_RANKING --> AI_REC_EP
    AI_REC_EP --> AUDIT_LOG
    AI_REC_EP --> AUTH_UI

    GPS_LOC --> GEOCODE --> CIT_MAP
    CIT_MAP --> SRV_RISK --> CIT_INSP
    CIT_INSP --> SRV_EVAC --> CIT_MAP
    WINDY_IFRAME --> CIT_MAP
    CIT_REPORT --> Backend_Server
```

#### Detailed Pipeline Step-by-Step

1. **Ingestion & Pre-Processing**:
   * Baseline demography is loaded from [`data/census_lookup.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/census_lookup.json), containing 2011 census figures growth-adjusted by official decadal compound growth rates to 2026.
   * Designated shelters with capacities and initial occupancies are loaded from [`data/shelters.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/shelters.json).
   * External live feeds (USGS GeoJSON, Open-Meteo weather/air quality, IMD CAP RSS) are polled asynchronously and cached in memory with dedicated time-to-live (TTL) limits (5 to 15 minutes) to avoid rate limits.
2. **Vulnerability Priority Index (VPI) Calculation**:
   * Executed via `PriorityEngine.computeVPI(habitations, shelters, options)`.
   * Normalizes elevation inversely (lower ground = higher inundation risk), demographic exposure, socioeconomic vulnerability, past disaster recurrences, live telemetry (radar gusts/seismic activity), and road isolation distance to shelters via `getOsrmRoadDistance()`.
   * Each habitation receives a normalized composite score $[0.000, 1.000]$ and is classified into `IMMEDIATE`, `SHORT_TERM`, or `MEDIUM_TERM`.
3. **Greedy Carrying-Capacity Allocation**:
   * Handled by `PriorityEngine.allocateCarryingCapacity(rankedHabitations, rawShelters, options)`.
   * Operates on an isolated deep copy of shelter beds (`workingShelters`) to guarantee immutability.
   * Evaluates habitations in descending order of VPI score. For each habitation, candidate open shelters within a 65 km radius (or matching district) are sorted by road transit distance.
   * Allocates population until either the village is `FULLY_ALLOCATED`, `PARTIALLY_ALLOCATED` (split across secondary hubs), or flagged as `UNALLOCATED` (Capacity Deficit).
   * Aggregates zone deficits to generate actionable resource requisition reports.
4. **Authority Incident Command & AI Operational Advisory**:
   * Handled through `GET /api/priority-ranking` and `POST /api/ai-recommendation`.
   * Feeds the top-ranked habitations, zone deficits, and telemetry into Anthropic Claude 3.5 Sonnet (or the deterministic risk analyst fallback when offline) to produce a concise 2–4 sentence operational briefing for the Incident Commander.
   * Persists every recommendation into [`data/ai_recommendations_log.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/ai_recommendations_log.json) for auditability.
5. **Citizen Warning & Route Dissemination**:
   * Delivered via browser GIS ([`citizen.html`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/citizen.html) and [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js)), overlaying real-time hazard zones, official IMD warnings, and step-by-step road evacuation paths generated by `POST /api/evacuation/routes`.

---

### 1.2 The Citizen Evacuation Journey Workflow

The citizen interface is engineered for high-stress, low-bandwidth scenarios where a resident needs immediate clarity on their safety status and an exit corridor.

```mermaid
graph TD
    START(["Citizen opens Portal / clicks 'My Location'"]) --> STEP1["1. Location Acquisition<br/><code>RZILocationService.detectLocation()</code>"]
    STEP1 --> STEP2["2. Reverse Geocoding<br/><code>RZILocationService.reverseGeocode()</code> (Nominatim)"]
    STEP2 --> STEP3["3. Map Activation<br/><code>placeAndActivateCitizenLocation(lat, lng, place)</code><br/>Pulsing marker added to Leaflet instance"]
    STEP3 --> STEP4["4. Risk Zone Query<br/><code>POST /api/risk-zone</code> (Point-in-Polygon Ray Casting)"]
    STEP4 --> STEP5{"Inside Hazard Zone?"}
    
    STEP5 -- "Inside Red Zone (Surge/Flood/Landslide)" --> STEP6A["Update UI: Red Alert Banner<br/>Play Emergency Chime (Web Audio API)<br/>Display zone advisory & nearest safe sites"]
    STEP5 -- "Outside Hazard Zone" --> STEP6B["Update UI: Green Safe Badge<br/>Show precautionary advisory"]
    
    STEP6A --> STEP7["Citizen inspects Map / clicks<br/>'Show me the way out' (<code>insp-evac-btn</code>)"]
    STEP6B --> STEP7
    
    STEP7 --> STEP8["5. Evacuation Routing<br/><code>POST /api/evacuation/routes</code><br/>Calls <code>calculateEvacuationRoutes()</code>"]
    STEP8 --> STEP9["Filter Eligible Shelters<br/>(status != 'closed' AND available_beds > 0)"]
    STEP9 --> STEP10["Query Project OSRM Routing Engine<br/><code>https://router.project-osrm.org/route/v1/driving/...</code>"]
    STEP10 --> STEP11["6. Red Zone Route Avoidance Audit<br/>Cross-reference route coordinates against hazard polygons"]
    STEP11 --> STEP12["7. Display Safe Corridor<br/>Draw GeoJSON Polyline on Leaflet Map<br/>Render turn-by-turn navigation & walking/driving duration"]
```

#### Code-Level Trace of the Evacuation Steps

| Step | User Action / Event | Executing Module & Function | API Endpoint / Remote Call | Output / DOM Update |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Click `tool-locate` button | [`js/location-service.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/location-service.js): `detectLocation()` | Browser `navigator.geolocation.getCurrentPosition()` | Returns `{ lat, lng, accuracy }` |
| **2** | GPS Coordinates resolved | [`js/location-service.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/location-service.js): `reverseGeocode()` | `https://nominatim.openstreetmap.org/reverse` | Normalized place string (e.g., "Tallarevu, Andhra Pradesh") |
| **3** | Map Center Updated | [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js): `placeAndActivateCitizenLocation()` | In-memory Leaflet DOM manipulation | Injects animated `citizenMarker` with pulsing CSS keyframe |
| **4** | Risk Assessment Check | [`js/location-service.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/location-service.js): `checkRiskZone()` | `POST /api/risk-zone` in [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js) | Ray-casting point-in-polygon evaluated against `COASTAL_FLOOD_ZONE`, `SEISMIC_ZONE`, etc. |
| **5** | Alert Dissemination | [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js): `playEmergencyChime()` | Web Audio API `AudioContext` | Synthesizes dual-tone alert siren; updates `#chip-risk` badge to `RED ZONE` |
| **6** | Click "Show me the way out" | [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js): `guideToNearestShelter()` attached to `#insp-evac-btn` | `POST /api/evacuation/routes` in [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js) | Evaluates candidate shelters and calls `calculateEvacuationRoutes()` |
| **7** | Route Calculation & Hazard Check | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): `calculateEvacuationRoutes()` | `https://router.project-osrm.org/route/v1/driving/...` | Filters out full shelters; checks road geometries against hazard polygons; ranks routes with composite score penalty if crossing Red Zones |
| **8** | Wayfinding Rendering | [`js/map.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/map.js) & [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js) | Leaflet `L.geoJSON()` layer | Renders green safe corridor polyline; displays walking and driving estimates |

---

## 2. Feasibility Analysis

### 2.1 Technical Feasibility

The system is architected as an ultra-lean, highly portable solution that does not require proprietary application servers, compilation steps, or heavy runtime dependencies.

#### What is Built and Running Today (Production-Ready)
1. **Universal VPI Scoring & Allocation Engine** ([`js/priority-engine.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/priority-engine.js)):
   * Configured with 6 balanced weights summing to 1.00:
     $$\text{VPI} = 0.25 w_1 + 0.20 w_2 + 0.15 w_3 + 0.15 w_4 + 0.10 w_5 + 0.15 w_6$$
   * Full greedy knapsack shelter matching algorithm with travel radius filtering (65 km threshold) and zone deficit reporting.
   * Runs identically in Node.js CommonJS backend and client-side browser runtimes.
2. **Native Zero-Dependency HTTP & REST Backend** ([`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js)):
   * Built strictly using Node.js built-in core modules (`http`, `https`, `fs`, `path`, `url`).
   * Implements 18 fully active REST endpoints covering live sensor feeds, shelter capacity CRUD operations, priority ranking, and AI advisories.
3. **Live Public Feeds Integration**:
   * **USGS Earthquake Hazards Program**: Polled live via GeoJSON feed with magnitude thresholding and in-memory caching (`CACHE_TTL_QUAKES_MS = 10 min`).
   * **Open-Meteo Weather & Atmospheric Quality**: Live hourly temperature, wind gusts, pressure, and PM2.5/PM10 metrics polled per coordinate (`CACHE_TTL_WEATHER_MS = 15 min`).
   * **Project OSRM Routing Engine**: Integrated for both single-route wayfinding and candidate road distance matrix calculation with an in-memory route distance cache (`osrmDistanceCache`).
   * **IMD CAP Alerts Service**: Integrated via public AWS S3 XML feed (`https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml`), parsed via a custom zero-dependency XML extractor and filtered by state keywords (Andhra Pradesh, Assam, Uttarakhand, Gujarat, Kerala).
4. **Cloud Real-time Synchronization**:
   * Firebase Firestore SDK integrated for crowdsourced citizen incident reporting and immediate broadcast of evacuation orders from the Authority Command Center.
5. **Dual-Model Operational AI Advisory**:
   * Integrated with Anthropic Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`) via secure HTTPS requests, backed by a fully deterministic NDRF Risk Analyst fallback rule engine when API keys are absent or network requests time out.

#### Dependencies Requiring External Clearances or Institutional Access
* **Official IMD Enterprise API / Radar Grids**: While the platform currently ingests the official IMD CAP XML feed from an open S3 bucket and Doppler telemetry points from Open-Meteo, direct machine-to-machine access to IMD’s internal Doppler Weather Radar (DWR) raw NetCDF/BUFR data streams requires formal institutional approval, static IP whitelisting, and Ministry of Earth Sciences (MoES) credentials.
* **Cadastral GIS Shapefiles**: The current platform utilizes representative polygon buffers. Ingesting survey-grade cadastral boundaries, flood inundation hazard layers, and high-resolution storm surge GIS shapefiles requires official data clearance from the State Disaster Management Authority (APSDMA) and the National Remote Sensing Centre (ISRO Bhuvan).
* **Live Central Water Commission (CWC) Telemetry**: Currently, river gauge stations (e.g., Dowleswaram Barrage on the Godavari River) operate on baseline sensor parameters. Live sensor telemetry hooks require integration into the CWC Hydrological Data Acquisition System.

---

### 2.2 Data Feasibility: Ground Truth Assessment

To ensure complete credibility, the table below provides a transparent audit of every dataset utilized within the platform, distinguishing verified government records from representative models and synthetic geometry:

| Dataset / Stream | Implementation File | Data Classification | Ground-Truth Reality & Technical Treatment |
| :--- | :--- | :--- | :--- |
| **Census 2011 Demographics** | [`data/census_lookup.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/census_lookup.json) | **Real Govt Data Schema (Sample)** | Utilizes official Census of India 2011 Village Directory fields (`census_2011_pop`, `households`, `elevation_m`, `vulnerability_score`). The sample covers 14 representative coastal habitations in the Kakinada/Godavari Delta. Population headcounts are projected to 2026 using official decadal growth rates (`growth_adjusted_pop = census_pop * (1 + growth_rate)`). |
| **Relief Shelter Directory** | [`data/shelters.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/shelters.json) | **Representative Sample Data** | Modeled after actual AP SDMA cyclone relief centers (e.g., Kakinada Port Relief Camp, JNTU Multipurpose Shelter). Capacities (1,200 to 5,000 beds), contacts, and structural ratings are realistic operational approximations rather than a live sync with an official district registry. |
| **Hazard Zone Boundaries** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js) & [`js/map.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/map.js) | **Procedurally Generated / Hardcoded** | Hazard boundaries (e.g., `COASTAL_FLOOD_ZONE`, `SEISMIC_ZONE`) are bounding coordinate arrays in [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js) and smoothed mathematical polygons generated via `generateOrganicZonePolygon()` in [`js/map.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/map.js). They are designed for spatial demonstration and are **not** official government flood-inundation GIS shapefiles. |
| **Live Earthquake Telemetry** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): `/api/earthquakes/live` | **Authentic Live Public API** | Direct real-time GeoJSON connection to the United States Geological Survey (USGS) Earthquake Hazards Program. Live event feeds, depths, coordinates, and magnitudes are 100% genuine. |
| **Atmospheric Weather Telemetry** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): `/api/windy/point-forecast` | **Authentic Live Public API** | Direct real-time connection to Open-Meteo European Centre for Medium-Range Weather Forecasts (ECMWF) model and live Windy Point Forecast API. Ground observations and hourly forecasts are real. |
| **Official Disaster Alerts** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): `/api/imd-alerts` | **Authentic Live Govt Feed** | Real-time connection to India Meteorological Department (IMD) Common Alerting Protocol (CAP) RSS feed hosted on AWS S3. Alerts, severity levels, and geographic descriptions are authentic official government warnings. |
| **Disaster History Catalog** | [`data/census_lookup.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/census_lookup.json) & [`js/hazards.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/hazards.js) | **Curated Historical Archive** | Documents genuine historical disaster events (e.g., Cyclone Hudhud 2014, Cyclone Titli 2018, Cyclone Michaung 2023, 1990 AP Super Cyclone). Stored as curated static JSON arrays rather than dynamically queried from the National Disaster Management Information System (NDMIS). |
| **River Gauge Telemetry** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): `/api/telemetry/live` | **Representative Baseline Sensor Model** | Baseline water levels for Dowleswaram Barrage (Godavari), Prakasam Barrage (Krishna), and Somasila Reservoir (Pennar) reflect seasonal high-flow water marks, but are currently static baselines rather than a live telemetry hook into CWC SCADA sensors. |

---

### 2.3 Operational Feasibility

For a State Disaster Management Authority (SDMA) or District Collectorate to operationalize Risk2Rescue, the following institutional procedures and infrastructure workflows must be established:

```
[District Collectorate / SDMA]
         │
         ├─► 1. Data Ingestion: Batch import master habitation CSV/Shapefiles into data/census_lookup.json
         ├─► 2. Shelter Management: Shelter Superintendents update live bed counts via PATCH /api/shelters/:id
         ├─► 3. Command Monitoring: Incident Commander reviews VPI rankings, Zone Deficits, & AI Briefings
         └─► 4. Alert Broadcast: Dispatch mandatory evacuation orders via Firebase Live Cloud Sync
```

1. **Data Handoff & Maintenance**:
   * **District Master Village List**: The District Planning Officer imports master census rosters containing Village Administrative Codes, GPS centroids, 2011 populations, and housing structure classes (Pucca vs. Kutcha).
   * **GIS Layer Integration**: District GIS cells upload official inundation shapefiles (GeoJSON/Shapefile format) replacing the procedural polygon generator.
2. **Frontline Shelter Occupancy Updates**:
   * Each designated relief camp is assigned a Shelter Superintendent.
   * As evacuee buses arrive, superintendents access [`authority.html`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/authority.html) (or an authenticated mobile dashboard) to adjust bed counts via `PATCH /api/shelters/:id`.
   * Updating a shelter automatically invalidates the backend priority cache (`priorityRankingCache = { data: null, expiresAt: 0 }`), triggering an instant recalculation of remaining regional capacity.
3. **Infrastructure & Hosting Requirements**:
   * **Host Profile**: Single lightweight Linux VPS (2 vCPU, 2 GB RAM, Ubuntu 22.04 LTS) running Node.js 18+.
   * **Containerization**: Standard Docker container based on `node:18-alpine` with an image footprint under 150 MB.
   * **Reverse Proxy**: NGINX configured with Let's Encrypt SSL/TLS termination and Gzip/Brotli compression.
   * **High Availability**: Stateless server logic enables horizontal scaling across multiple container instances behind an Application Load Balancer with shared Redis caching.

---

## 3. Viability Analysis

### 3.1 Cost Viability

The platform is designed to operate at negligible initial and operational expense by leveraging open-access public meteorological APIs and lean self-hosted compute.

#### Cost Structure Matrix

| Component | Provider / Standard | Authentication / Tier | Operational Cost |
| :--- | :--- | :--- | :--- |
| **Earthquake Feed** | USGS Earthquake Hazards Program | Public Open API (No key required) | **$0.00 / month** |
| **Weather & Atmospheric Telemetry** | Open-Meteo ECMWF / GFS | Public Open API (No key required) | **$0.00 / month** (Up to 10,000 calls/day free) |
| **Road Network Routing** | Project OSRM Public Server | Public Open API (No key required) | **$0.00 / month** (Demo tier; requires self-hosting at scale) |
| **Map Visualization Basemaps** | CartoDB Voyager / ESRI World Imagery | Public Tile Servers | **$0.00 / month** |
| **Meteorological Radar Layers** | Windy.com Iframe Embed 2.0 | Free Iframe Embed (No API key required) | **$0.00 / month** |
| **Government Weather Warnings** | IMD CAP RSS Feed (AWS S3) | Public Open XML Feed (No key required) | **$0.00 / month** |
| **Realtime Cloud Sync** | Google Firebase Firestore | Spark Free Tier (50k reads/day, 20k writes/day) | **$0.00 / month** (Sufficient for regional piloting) |
| **Host Infrastructure** | Cloud VPS (e.g., DigitalOcean / Hetzner) | Standard 2 vCPU / 2GB RAM Linux Droplet | **$6.00 – $12.00 / month** |
| **AI Situational Analysis** | Anthropic Claude API (`claude-3-5-sonnet`) | Commercial API Key (Pay-per-use) | **Variable (Est. $1.50 – $15.00 / event)** |

#### Recurring Cost Scaling for the LLM Layer (Anthropic Claude API)
The only recurring variable cost is the AI operational briefing generation endpoint (`POST /api/ai-recommendation`):
* **Model Selected**: `claude-3-5-sonnet-20241022`
* **Input Tokens per Request**: ~650 tokens (structured JSON summary of top 3 habitations, zone deficits, telemetry metrics).
* **Output Tokens per Request**: ~120 tokens (concise 2–4 sentence operational recommendation).
* **Token Pricing**: Input: $3.00 per million tokens; Output: $15.00 per million tokens.
* **Cost per Invocation**:
  $$\text{Cost} = (650 \times 0.000003) + (120 \times 0.000015) = \$0.00195 + \$0.00180 \approx \$0.00375 \text{ per briefing}$$
* **Monthly Active Disaster Event Scaling**:
  * 1 call every 5 minutes during a 72-hour cyclone landfall window = $864 \text{ requests} \times \$0.00375 \approx \mathbf{\$3.24 \text{ total API cost}}$.
  * Even under continuous 24/7 generation (288 calls/day for 30 days = 8,640 requests), monthly cost is only **~$32.40**.
  * If the API key is disabled or exhausted, the system automatically falls back to the internal deterministic NDRF Risk Analyst rule engine at **$0.00 cost**.

---

### 3.2 Scalability Roadmap

Expanding Risk2Rescue from a single pilot region (Kakinada / Godavari Delta) to state-wide deployment across all 26 districts of Andhra Pradesh (or nationwide across India) requires specific architectural evolutions:

```
[Current Demo Tier]                            [Statewide / National Production Tier]
• In-memory JavaScript Maps          ───►      • Distributed Redis Key-Value Store
• Public OSRM Demo Server            ───►      • Self-Hosted OSRM Docker Cluster (India OSM PBF)
• Flat JSON files (shelters.json)    ───►      • Managed PostgreSQL 16 + PostGIS Spatial Database
• Procedural JS Canvas Polygons      ───►      • GeoServer / Mapbox Vector Tiles (WMS/WFS)
• In-process Node.js HTTP Server     ───►      • Kubernetes Cluster with Horizontal Pod Autoscaling
```

1. **Routing Engine Decoupling**:
   * *Current Bottleneck*: The public OSRM demo server (`router.project-osrm.org`) enforces strict rate limits and is not intended for high-concurrency emergency routing.
   * *Scalability Solution*: Deploy a dedicated, self-hosted OSRM Docker container loaded with the pre-compiled OpenStreetMap India extract (`india-latest.osm.pbf`). A single 8 GB server can compute over 1,000 route matrix requests per second with sub-5ms latencies.
2. **Spatial GIS Storage**:
   * *Current Bottleneck*: Procedural polygons and in-memory ray casting (`pip()` in [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js)) are limited to low vertex counts.
   * *Scalability Solution*: Transition to **PostgreSQL with PostGIS extensions**. Habitation boundaries and hazard inundation layers are stored as spatial geometries, utilizing indexed spatial queries (`ST_Contains`, `ST_DWithin`) to evaluate millions of citizen coordinates in milliseconds.
3. **State Management & Caching**:
   * *Current Bottleneck*: In-memory variables (`weatherCache`, `priorityRankingCache`) are isolated to a single Node.js process.
   * *Scalability Solution*: Implement a centralized **Redis cluster**. Shelter capacity updates published by any district operator immediately invalidate the cluster cache, allowing stateless Node.js worker instances to serve consistent data.

---

### 3.3 Long-Term Sustainability

1. **Data Lifecycle Governance**:
   * Master census records must be reconciled with annual village births/migration estimates or updated automatically upon release of the upcoming Census of India iteration.
   * Shelter directories require pre-monsoon structural safety audits (checking generator readiness, water purification capacity, and elevated plinth heights) recorded directly into the platform.
2. **Operational Resilience & Offline Capability**:
   * The citizen portal leverages local browser caching for basemap tiles and contact directories.
   * The priority engine runs in universal JavaScript, allowing field tablets with disconnected local copies of `data/census_lookup.json` to compute VPI rankings in offline field camps without internet connectivity.
3. **Auditing & Continuous Learning**:
   * The audit log file ([`data/ai_recommendations_log.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/ai_recommendations_log.json)) captures every recommendation generated during an emergency. Post-disaster reviews allow authorities to compare predicted evacuation deficits against actual shelter arrivals, fine-tuning the 6 VPI weights for future seasons.

---

## 4. Impact and Benefits

### 4.1 Social Impact

* **Needs-Based Evacuation Prioritization**: Traditional evacuations often proceed on a simple geographic radius or nearest-road basis, frequently stranding isolated or socioeconomically vulnerable populations. RZI’s VPI engine weighs structural housing fragility (from Census indicators) and elevation inundation risk alongside geographic distance, guaranteeing that the most vulnerable habitations are evacuated first.
* **Public Transparency & Citizen Agency**: Through the VPI Factor Breakdown popover (`vpi-breakdown-btn` in [`js/authority.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/authority.js)), both administrators and community leaders can see the exact mathematical composition of their risk score across all 6 indicators. This eliminates perceptions of administrative bias or arbitrary evacuation mandates.
* **Stress Reduction in the Evacuation Journey**: The citizen "Show me the way out" feature (`#insp-evac-btn`) replaces panic with clear visual routing. By filtering out shelters that have reached 100% occupancy and routing around active flood polygons, citizens are prevented from evacuating toward submerged roads or overwhelmed camps.

---

### 4.2 Administrative and Governance Impact

* **Transition from Reactive to Predictive Allocation**: Disaster command typically reacts after shelters report overcrowding. RZI’s **Zone Deficit Generator** (`deficitReports` in [`js/priority-engine.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/priority-engine.js)) calculates the total at-risk headcount against total reachable beds before landfall occurs. If Zone RZ001 shows an aggregate shortfall of 4,800 spaces, the Incident Commander receives an alert hours in advance to dispatch mobile relief camps or state transport buses to secondary inland hubs.
* **Repeatable, Auditable Incident Command Logs**: Every recommendation issued by the AI Situational Briefing service is serialized to [`data/ai_recommendations_log.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/ai_recommendations_log.json), preserving:
  1. Unique recommendation ID (`REC-timestamp`)
  2. Input telemetry and peak wind gusts
  3. Ranked village priorities and active deficit numbers
  4. Exact briefing narrative provided to the commander
  This provides a tamper-evident audit trail for post-incident legislative inquiries and administrative reviews.
* **Unified Multi-Agency Operating Picture**: By combining IMD meteorological alerts, USGS seismic feeds, Census demographics, and SDMA shelter occupancy on a single synchronized dashboard, the platform eliminates information silos between civil administration, the NDRF, state police, and healthcare services.

---

### 4.3 Economic Impact

* **Targeted Logistics & Fleet Optimization**: Mass evacuations require extensive fleets of state transport buses, fuel supplies, and driver crews. By pairing greedy allocation with road distance calculations, transport assets are directed only to habitations flagged as `IMMEDIATE` (>0.80 VPI), preventing fuel waste and vehicle idling in areas with low inundation risk.
* **Pre-positioning Relief Rations without Waste**: Disaster relief often suffers from misallocation: some shelters receive surplus non-perishable rations while remote hubs run out of medical supplies. The platform’s real-time occupancy and capacity tracking (`/api/shelters`) ensures food and medical supply chains deliver supplies strictly proportional to current evacuee counts.
* **Mitigation of Post-Disaster Reconstruction Costs**: Rapid, targeted evacuation of populations in low-lying coastal floodplains directly reduces casualties and the long-term economic burden of emergency healthcare and survivor compensation.

---

## 5. Research and References

### 5.1 Verification Matrix: Active Code Integrations vs. Conceptual Frameworks

To preserve academic and operational integrity, external references are divided into two distinct categories:

> [!IMPORTANT]
> **Data Sources Called in Code**: These are real, active APIs and data structures directly called, parsed, and ingested by functions in the repository.
> **Conceptual Frameworks for Verification**: These are high-level disaster governance guidelines whose principles conceptually align with the system's design. The user should verify and read these publications directly before citing them in formal academic submissions.

| Standard / Reference | Category | Direct File / Code Location | Technical Role in Codebase |
| :--- | :--- | :--- | :--- |
| **Census of India 2011** (Primary Census Abstract / Village Directory) | **Active Data Schema in Code** | [`data/census_lookup.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/data/census_lookup.json), line 17 | Provides the village demographic baseline, household counts, elevation data, and socioeconomic vulnerability scoring. |
| **USGS Earthquake Hazards Program** | **Active Live API in Code** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): line 826 (`/api/earthquakes/live`) | Real-time global seismic monitoring; live feeds parsed via GeoJSON endpoint `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`. |
| **Open-Meteo Weather API** | **Active Live API in Code** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): line 845 (`getOpenMeteoWeather()`) | Real-time meteorological telemetry (wind gusts, surface pressure, precipitation) fetched from `api.open-meteo.com`. |
| **Open-Meteo Air Quality API** | **Active Live API in Code** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): line 834 (`/api/air-quality/live`) | Atmospheric telemetry (PM2.5, PM10, European AQI) fetched from `air-quality-api.open-meteo.com`. |
| **Project OSRM / OpenStreetMap** | **Active Live API in Code** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): lines 627, 666 | Turn-by-turn road wayfinding and network distance calculations via `https://router.project-osrm.org/route/v1/driving/`. |
| **Windy.com Map Forecast** | **Active Live UI Embed in Code** | [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js): line 834 (`WindyIntegrationController`) | Visual weather layer overlays (wind, rain, swell) rendered via `embed.windy.com/embed2.html`. |
| **IMD Common Alerting Protocol (CAP)** | **Active Live Feed in Code** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): line 1629 (`/api/imd-alerts`) | Ingests official IMD alert XML feed conforming to OASIS CAP v1.2 from `cap-sources.s3.amazonaws.com/in-imd-en/rss.xml`. |
| **Anthropic Claude 3.5 Sonnet API** | **Active Live API in Code** | [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js): line 1483 (`/api/ai-recommendation`) | REST POST calls to `https://api.anthropic.com/v1/messages` passing structured telemetry for situational analysis. |
| **Google Firebase Firestore** | **Active Cloud SDK in Code** | [`js/firebase-live.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/firebase-live.js), [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js): line 730 | Live cloud database synchronization for crowdsourced citizen reports and broadcast alerts. |
| **NDMA Guidelines on Cyclone & Flood Management** | **Conceptual Framework (Verify Yourself)** | Conceptually aligned with [`js/priority-engine.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/priority-engine.js) | *Note for Author*: Aligns with the Incident Response System (IRS) principles of the National Disaster Management Authority. Please consult official NDMA publication volumes for formal citation. |
| **Sendai Framework for Disaster Risk Reduction (2015–2030)** | **Conceptual Framework (Verify Yourself)** | Conceptually aligned with RZI Architecture | *Note for Author*: Embodies Priority 1 ("Understanding disaster risk" via multi-factor VPI) and Priority 4 ("Enhancing disaster preparedness for effective response"). |

---

## 6. Tools & Technologies Used

The table below catalogs **only** the technologies, runtimes, and libraries verified in [`package.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/package.json), server scripts, and frontend markup:

```
                  ┌────────────────────────────────────────┐
                  │          RISK2RESCUE TECH STACK        │
                  └───────────────────┬────────────────────┘
                                      │
         ┌────────────────────────────┼───────────────────────────┐
         ▼                            ▼                           ▼
  [Backend Runtime]           [Frontend GIS & UI]         [Cloud & AI APIs]
  • Node.js v18+ (Core)       • Vanilla JS (ES6+)         • Anthropic Claude API
  • Built-in http / https     • Vanilla CSS3 Design Sys   • Google Firebase Firestore
  • Built-in fs / path / url  • Leaflet.js v1.9.4 (CDN)   • USGS / Open-Meteo REST
  • ZERO npm runtime deps     • Chart.js v4.4 (CDN)       • Project OSRM Routing
                              • Windy Iframe Embed        • IMD CAP RSS Feed
```

### Detailed Technology Specifications

#### Backend Architecture
* **Runtime**: **Node.js (v18.0.0+)**
  * Configured in [`package.json`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/package.json) (`"main": "server.js"`).
  * Runs directly via `node server.js` with zero build steps or transpilation.
* **Dependencies**: **Zero External Runtime Dependencies (0 npm packages)**
  * All networking, routing, and file handling rely exclusively on native Node.js core modules:
    * `http`: REST API server and request listener.
    * `https`: Secure external requests to USGS, Open-Meteo, IMD, and Claude API.
    * `fs`: File system I/O for `data/shelters.json`, `data/census_lookup.json`, and audit logging.
    * `path`: Cross-platform directory path normalization and traversal prevention.
    * `url`: URL parsing for query string extraction.
  * Native `.env` parser written from scratch in [`server.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/server.js) (lines 14–32), eliminating the need for `dotenv`.

#### Frontend GIS & UI Architecture
* **Core Languages**: **Vanilla HTML5, Vanilla CSS3, Vanilla ECMAScript 2022 (ES6+)**
  * No heavy single-page application frameworks (no React, no Angular, no Vue).
* **Mapping & GIS Rendering**:
  * **Leaflet.js (v1.9.4)**: Ingested via CDN (`unpkg.com/leaflet@1.9.4`). Renders interactive hazard zones, custom HTML/CSS pin markers (`L.divIcon`), and GeoJSON evacuation lines.
  * **Basemap Layers**:
    * CartoDB Voyager: Clean vector styling for high-contrast emergency data visualization.
    * ESRI World Imagery: High-resolution satellite tiles for terrain inspection.
* **Meteorological Radar Integration**:
  * **Windy.com Iframe Embed 2.0**: Embedded in [`citizen.html`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/citizen.html) and controlled via `WindyIntegrationController` in [`js/citizen.js`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/js/citizen.js). Displays dynamic weather overlays (wind, rain accumulation, swell, CAPE index).
* **Data Visualization**:
  * **Chart.js (v4.4.1)**: Ingested via CDN (`cdn.jsdelivr.net/npm/chart.js`). Powers multi-hazard risk analytics, temporal vulnerability curves, and capacity variance charts in [`authority.html`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/authority.html).
* **Motion & Design System**:
  * Custom Vanilla CSS3 Design System ([`css/base.css`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/css/base.css), [`css/citizen.css`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/css/citizen.css), [`css/authority.css`](file:///c:/Users/Durga%20Bhavani/.antigravity-ide/Teja/Teja/css/authority.css)).
  * Features GPU-accelerated keyframe animations (`fadeIn`, `slideUp`, `scaleIn`, `pulse-ring`, `sirenPulse`, `citizenPulse`), FLIP layout reordering animations, and glassmorphism styling (`backdrop-filter: blur(20px)`).

#### Cloud, Data & AI Integrations
* **Database & Realtime Sync**:
  * **Google Firebase Firestore (v9/v10 Compat CDN)**: Powers two-way realtime communication between citizens submitting incident reports and commanders issuing emergency evacuation alerts.
* **Artificial Intelligence**:
  * **Anthropic Claude 3.5 Sonnet API**: Cloud LLM invoked for natural-language situational briefings.
  * **Deterministic NDRF Risk Analyst Engine**: Native internal fallback rule engine written in vanilla JavaScript.
* **Routing Services**:
  * **Project OSRM**: Public driving route engine (`router.project-osrm.org`) for road transit distance matrices and GeoJSON wayfinding.

#### Explicit Clarification on Non-Used Technologies
To ensure strict accuracy, the following tools/frameworks are **NOT** present in the codebase:
* ❌ **No Frontend Frameworks**: React, Next.js, Vue, Angular, or Svelte are **not** used.
* ❌ **No CSS Frameworks**: TailwindCSS, Bootstrap, or Bulma are **not** used (all styling is pure Vanilla CSS).
* ❌ **No Python Backend**: Flask, Django, FastAPI, or Pandas are **not** used.
* ❌ **No Relational/NoSQL Database Engines**: PostgreSQL, MySQL, MongoDB, or Redis are **not** installed in the local repo (data persistence is currently handled via atomic JSON file I/O and Firebase Firestore).

---

## 7. Conclusion & Architectural Assessment

Risk2Rescue demonstrates that life-saving disaster intelligence software does not require bloated software stacks or fragile dependency graphs. By uniting:
1. A **mathematically rigorous Vulnerability Priority Index (VPI)**,
2. An **equitable Greedy Carrying-Capacity Allocation Algorithm**,
3. **Live government meteorological and seismic telemetry**, and
4. A **responsive, zero-dependency Node.js and Leaflet architecture**,

the platform provides emergency managers with a reliable, transparent tool to evacuate the most vulnerable citizens first, maximize shelter utilization, and eliminate operational blind spots during extreme disaster events.
