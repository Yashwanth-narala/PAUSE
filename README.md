# PAUSE V1 Starter
React + Vite frontend, FastAPI backend, supervisor-style analysis pipeline, and Amazon Bedrock integration.

## Run locally (Windows + VS Code)

### Backend terminal
```powershell
cd PAUSE_V1/backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```
If PowerShell blocks activation: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### Frontend terminal
```powershell
cd PAUSE_V1/frontend
npm install
npm run dev
```
Open the Vite URL printed in the terminal, usually http://localhost:5173.

Start with `PAUSE_DEMO_MODE=true` so the complete flow works before AWS setup. Demo mode uses simple rules; it is not a validated classifier.

## Connect AWS after account + coupon setup
- Confirm the challenge coupon/credits in AWS Billing > Credits.
- Confirm the coupon terms and eligible services.
- In Amazon Bedrock, test a model in the selected region.
- Configure AWS CLI credentials locally; never paste keys into code or commit `.env`.
- Set `PAUSE_DEMO_MODE=false`, `AWS_REGION`, and `BEDROCK_MODEL_ID` in `backend/.env`.
- The backend calls Amazon Bedrock Converse API. Some models need extra permissions or first-use steps.

## Privacy/security
No database is used; submitted text is not persisted by this starter. Do not test with real passwords, OTPs, bank details, identity documents, or customer data. Before public deployment, add rate limiting/authentication and restrict CORS to the deployed frontend origin.
