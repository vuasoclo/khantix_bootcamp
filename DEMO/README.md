# KHantix AI CPQ System (Configure, Price, Quote)

Welcome to the **KHantix AI CPQ**, an Automated Price Recommendation & Quoting Engine designed for B2B IT service companies. 

The system solves the critical "Price Leakage" problem where over-discounting ruins profit margins. By enforcing a **Dual-Guardrails** mechanism (Rule-based Floor Protection + AI-driven Optimization), KHantix empowers Pre-sales teams to close deals quickly while automatically protecting the company's operational bottom line.

---

## 🎯 Architecture Overview

1. **Frontend / CPQ Dashboard (Next.js/React):** Provides dynamic tree configurations (Productization) and real-time computation using Debounce hooks to avoid overloading the backend.
2. **Pricing Engine (Node.js / Express):** The core backend. Computes cost data, routes requests, validates profit margins, and manages the rule-based guardrails.
3. **AI Recommendation Layer (Mocked as Python Microservice):** Analyzes historical win-rates to suggest optimal discount percentages.
4. **Data Layer (PostgreSQL BCNF):** Uses Slowly Changing Dimensions (SCD2) for rate cards, guaranteeing that old quotes maintain their original cost structures despite future inflation/rate-card updates.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **TypeScript** (installed globally or via `npm`)
- **PostgreSQL** (to run the database scripts)

---

## 🛠 Setup & Installation

**1. Clone the repository and navigate to the DEMO directory:**
```bash
cd DEMO
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure Environment Variables (Connecting to 9Router AI APIs):**
Create a `.env` file in the root of the `DEMO` directory. 
To use the AI Negotiation and Recommendation system, the application uses an LLM Adapter. You can connect it to **9Router** (a local AI proxy) easily by setting the following variables:

```env
PORT=3000

# Set adapter to 9router
LLM_PROVIDER=9router

# 9Router specific configuration
NINEROUTER_API_BASE=http://localhost:20128/v1
NINEROUTER_MODEL=gemini-3-flash
NINEROUTER_API_KEY=your_local_key_here
```
*(By default, if `LLM_PROVIDER` is set to `9router`, the adapter will automatically use the OpenAI-compatible client to route requests to your 9Router base URL.)*

**4. Initialize the Database:**
Execute the `schema.sql` script into your PostgreSQL database.
Ensure you have the `uuid-ossp` extension enabled in Postgres.
```bash
psql -U your_postgres_user -d your_database -f db/schema.sql
```

**5. Start the Application:**
For development, start the local server using `ts-node`:
```bash
npm run start
```
> You will see a console output indicating the server is running at `http://localhost:3000`

---

## 📖 How It Works & API Usage

Use any API client (e.g., Postman, Insomnia, or cURL in your terminal) to test the workflow.

### Step 1: Health & System Check
Verify that the server and base configs are loaded.
- **Endpoint:** `GET /api/health`
- **Command:**
  ```bash
  curl --location 'http://localhost:3000/api/health'
  ```

### Step 2: Fetch the Product Catalog (Productization)
Pre-sales loads the configured IT service modules (e.g., Backend Dev, OAuth module, etc.) along with base hours and the internal rate cards.
- **Endpoint:** `GET /api/cpq/product-catalog`
- **Command:**
  ```bash
  curl --location 'http://localhost:3000/api/cpq/product-catalog'
  ```

### Step 3: Get AI Price Recommendation
Instead of guessing a discount, Pre-sales requests the AI layer to find the optimal selling price based on the project's scale and historical closing data.
- **Endpoint:** `POST /api/cpq/quotes/recommend-price`
- **Payload:**
  ```json
  {
    "client_industry": "Retail",
    "project_complexity": "HIGH",
    "total_list_price": 2480.00,
    "total_floor_cost": 1240.00
  }
  ```
- **Command:**
  ```bash
  curl --location 'http://localhost:3000/api/cpq/quotes/recommend-price' \
  --header 'Content-Type: application/json' \
  --data '{"client_industry": "Retail", "project_complexity": "HIGH", "total_list_price": 2480.00, "total_floor_cost": 1240.00}'
  ```
- **Result:** Returns an optimized discount percentage (e.g., 40% off the padding margin) and predicts an 85% Win Probability.

### Step 4: The Final Guardrail (Exporting Quote)
When exporting to PDF, the Node.js backend locks down the database floor cost and validates if the sale is authorized.

**Scenario A: Unauthorized Discounting (Selling Below Floor Cost)**
If the requested price is lower than the floor cost ($1240.00), the system rejects the operation explicitly.
- **Payload:**
  ```json
  {
    "quote_id": "test-quote-id",
    "requested_final_price": 1100.00
  }
  ```
- **Result:** Fails with a `403 Forbidden` error, responding `GUARDRAIL_VIOLATION`. The request must be routed to the Board of Directors.

**Scenario B: Safe & Profitable Quotes**
If the price is structurally safe, the system allows the action to proceed.
- **Payload:**
  ```json
  {
    "quote_id": "test-quote-id",
    "requested_final_price": 2000.00
  }
  ```
- **Result:** Yields a `200 OK` status, capturing the final `actual_margin_pct` (e.g., ~38%), and provides the generated PDF URL for client delivery.

---

## 📂 Project Structure

```text
DEMO/
├── db/
│   └── schema.sql                # PostgreSQL DDL ensuring BCNF normalization
├── package.json                  # Dependencies
├── src/
│   ├── config/                   # Default business logic parameters
│   ├── controllers/              # Handles HTTP request/responses
│   ├── repositories/             # Database access and Mock data layers
│   ├── routes/                   # API Endpoint Definitions mapped to controllers
│   ├── services/                 # Dedicated Business logic files:
│   │   ├── quote-guardrail.service.ts
│   │   └── ai-recommendation.service.ts
│   ├── types/                    # TypeScript interfaces
│   └── server.ts                 # Express initialization and Bootstrap Configuration
└── README.md                     # You're reading this!
```

---
*KHantix Architecture. Built for Speed, Scalability, and Profit Protection.*
