# Sentinel Mosaic - Demo Script
## CMU Hackathon 2026

### Pre-Demo Checklist
```bash
# 1. Start Docker (Redpanda)
docker compose up -d redpanda redpanda-console

# 2. Start Ollama (if not running)
ollama serve

# 3. Start backend
cd /Users/farhan/Documents/GitHub/cmu-hackathon
source backend/.venv/bin/activate
python -m uvicorn backend.api.server:app --host 0.0.0.0 --port 8000

# 4. Start frontend (in another terminal)
cd frontend/mosaic-command-center
npm start

# 5. Verify everything
curl http://localhost:8000/api/health
# Open http://localhost:3000
```

---

### Demo Flow (3-4 minutes)

#### 1. OPENING (30 sec)
> "This is **Sentinel Mosaic** - an autonomous fraud detection platform that assembles fragments of financial data into a real-time security shield."

- Point to the header: "SENTINEL MOSAIC" with LIVE indicator
- Point to the stats bar: transactions flowing in real-time, counting up

#### 2. TRANSACTION FEED (30 sec)
> "Every transaction from our banking API flows through a Redpanda stream - that's Kafka-compatible event streaming - and appears here in real-time."

- Show the live transaction feed scrolling
- Point out merchants: Starbucks, Giant Eagle, Target - normal Pittsburgh spending
- Note the green risk dots: "These are all scoring as low-risk"

#### 3. ANOMALY DETECTION (30 sec)
> "Our Isolation Forest machine learning model analyzes every transaction against 8 different features - amount patterns, geographic velocity, spending z-scores, and more."

- Wait for a natural anomaly OR trigger one:
```bash
curl -X POST "http://localhost:8000/api/demo/inject-fraud?scenario=0"
```
- Watch the red alert appear: "A $12,450 luxury watch purchase in Bucharest, Romania - just minutes after a coffee in Pittsburgh"
- Point to the risk factors: "Impossible travel, high-value, international, high-risk category"

#### 4. AI AGENT BRAIN TRACE (60 sec) *** THE SHOWSTOPPER ***
> "Now watch what happens next. Instead of just flagging this alert, our autonomous AI agent - running Llama 3 locally - begins investigating."

- Point to the Agent Brain Trace console
- Watch the green THOUGHT steps appear: "The agent is reasoning about the transaction"
- Watch the yellow ACTION steps: "It's calling tools - checking account history, verifying the merchant"
- Watch the cyan RESULT steps: "The merchant isn't registered, travel is impossible"
- Watch the white VERDICT: "The agent recommends BLOCKING the account"
- > "This entire investigation happened autonomously in real-time - no human in the loop."

#### 5. SYSTEM TOPOLOGY (20 sec)
> "Here's our full architecture visualized - data flows from the Nessie banking API through Redpanda, through our anomaly engine, triggers the AI agent, and everything streams to this dashboard via WebSockets."

- Point to the animated edges showing data flow
- Point to the node labels

#### 6. GOVERNANCE (20 sec)
> "Finally, our compliance layer. We enforce bank-grade security using Cloud Custodian for infrastructure and Open Policy Agent for transaction governance."

- Point to the 99.6% compliance score
- Point to the policy list: "Auto-encrypted S3 buckets, tag enforcement, IAM auditing"
- > "All of this is Compliance-as-Code - defined in YAML and Rego, versioned in Git, enforced automatically."

#### 7. CLOSE (20 sec)
> "Sentinel Mosaic takes scattered fragments of financial data - transactions, merchant records, geographic coordinates - and assembles them into an autonomous security shield. Real-time streaming, machine learning, and AI investigation, all governed by compliance-as-code."

---

### Emergency Fraud Scenarios
If the auto-generated anomalies aren't dramatic enough:

```bash
# Scenario 0: $12,450 luxury watches in Bucharest (impossible travel)
curl -X POST "http://localhost:8000/api/demo/inject-fraud?scenario=0"

# Scenario 1: $8,900 gold exchange in Lagos (rapid fire)
curl -X POST "http://localhost:8000/api/demo/inject-fraud?scenario=1"

# Scenario 2: $14,999 crypto ATM in Moscow (cash-out pattern)
curl -X POST "http://localhost:8000/api/demo/inject-fraud?scenario=2"
```

### Troubleshooting
| Issue | Fix |
|-------|-----|
| Dashboard shows DISCONNECTED | Restart backend: `pkill -f uvicorn && python -m uvicorn backend.api.server:app --host 0.0.0.0 --port 8000` |
| No transactions flowing | Check Redpanda: `docker compose ps` |
| Agent shows "model not found" | Run `ollama pull llama3:8b` and wait for download |
| Agent is slow | Normal for first invocation. Subsequent calls are faster. |
| Need faster agent | Use smaller model: `ollama pull llama3.2:3b` then set `OLLAMA_MODEL=llama3.2:3b` in `.env` and restart backend |

### Tech Stack (for judge Q&A)
- **Streaming**: Redpanda (Kafka-compatible, zero-JVM)
- **ML**: scikit-learn IsolationForest (8 features: amount, log-amount, time, day, international, velocity, distance, z-score)
- **AI Agent**: LangGraph + Ollama/Llama 3 8B with 5 custom tools (ReAct pattern)
- **Backend**: FastAPI + aiokafka + WebSockets
- **Frontend**: React + TypeScript + Tailwind CSS + Recharts + React Flow
- **Compliance**: Cloud Custodian (YAML) + Open Policy Agent (Rego)
- **Infrastructure**: Docker Compose, Redpanda single-node
