# Sentinel Mosaic: Autonomous Financial Governance & Fraud Shield
## CMU Hackathon Project

A high-impact, enterprise-grade fraud detection and compliance system combining:
- Real-time event streaming with Kafka/Redpanda
- Autonomous AI agents for fraud investigation
- Compliance-as-Code with Cloud Custodian and OPA
- Modern React dashboard (Mosaic Command Center)

### Project Structure
```
sentinel-mosaic/
├── backend/                 # Python backend services
│   ├── nessie_client/      # Nessie API integration
│   ├── streaming/          # Kafka/Redpanda producers
│   ├── anomaly_detection/  # Isolation Forest engine
│   ├── agent/              # LangChain autonomous agents
│   └── api/                # FastAPI server
├── frontend/               # React + Tailwind dashboard
│   └── mosaic-command-center/
├── infrastructure/         # Cloud Custodian & OPA policies
├── docker-compose.yml      # Local dev environment
└── docs/                   # Architecture & API docs
```

### Quick Start
See `DEVELOPMENT.md` for setup instructions.
