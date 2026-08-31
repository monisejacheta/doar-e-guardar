---
title: Casa Crianca PI Backend
emoji: 📦
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
---

# Casa Crianca PI Backend

Backend Node/Express para o app Casa Crianca PI.

## Variaveis obrigatorias

Configure no painel do Space:

```env
DATABASE_URL=postgresql://...
DATABASE_SOURCE=online
ML_CLASSIFICATION_URL=https://juulianomancini-casacriancapi.hf.space/gradio_api/call/predict
CORS_ORIGIN=*
```
