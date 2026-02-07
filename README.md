# Sentinel Mosaic: Autonomous Financial Governance & Fraud Shield
## CMU Hackathon 2026

An enterprise-grade fraud detection platform that assembles fragments of financial data into an autonomous security shield. Real-time event streaming, ML-powered anomaly detection, and autonomous AI agent investigation, all governed by compliance-as-code.

### Architecture
```
[Nessie API / Mock Generator] --> [Redpanda Stream] --> [Anomaly Engine (IsolationForest)]
                                                                    |
                                                        [AI Agent (LangGraph + Llama 3)]
                                                                    |
                                                        [FastAPI + WebSocket] --> [React Dashboard]
```

### Tech Stack
- **Streaming**: Redpanda (Kafka-compatible, zero-JVM overhead)
- **ML**: scikit-learn IsolationForest with 8-feature extraction
- **AI Agent**: LangGraph + Ollama/Llama 3 8B with 5 custom tools (ReAct pattern)
- **Backend**: FastAPI + aiokafka + WebSockets
- **Frontend**: React + TypeScript + Tailwind CSS + Recharts + React Flow
- **Compliance**: Cloud Custodian (YAML) + Open Policy Agent (Rego)

### Project Structure
```
sentinel-mosaic/
├── backend/
│   ├── api/                   # FastAPI server, WebSocket, governance endpoints
│   ├── streaming/             # Kafka producer (mock data) + consumer
│   ├── anomaly_detection/     # IsolationForest engine + feature extraction
│   ├── agent/                 # LangGraph fraud investigation agent + tools
│   └── nessie_client/         # Capital One Nessie API integration
├── frontend/
│   └── mosaic-command-center/ # React + Tailwind bento grid dashboard
├── infrastructure/
│   ├── cloud-custodian/       # YAML compliance policies
│   └── opa/                   # Rego transaction governance rules
├── docker-compose.yml         # Redpanda single-node
└── DEMO_SCRIPT.md             # Presentation guide
```

### Quick Start

```bash
# 1. Start Redpanda
docker compose up -d

# 2. Install Python dependencies
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3. Pull Llama 3 model
ollama pull llama3:8b

# 4. Start backend
python -m uvicorn backend.api.server:app --host 0.0.0.0 --port 8000

# 5. Start frontend (new terminal)
cd frontend/mosaic-command-center && npm install && npm start

# 6. Open dashboard
open http://localhost:3000
```

### Demo
See `DEMO_SCRIPT.md` for the full presentation flow and fraud injection commands.
