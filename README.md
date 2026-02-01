# UGC Avatar Video Platform

A production-ready platform for generating full-body avatar videos using OmniAvatar AI, built with FastAPI, Celery, and Docker.

## Quick Start (5 Minutes)

### Fastest Way to Test:

```powershell
cd C:\Users\loke_\Downloads\ugc-avatar-platform

# 1. Start all services
.\start.ps1

# 2. In a new terminal, start backend
cd backend
uvicorn app.main:app --reload

# 3. In another terminal, test API
.\test_api.ps1

# 4. Open in browser
start http://localhost:8000/docs
```

**See [QUICK_TEST.md](QUICK_TEST.md) for step-by-step testing guide.**

For full setup: [TESTING_GUIDE.md](TESTING_GUIDE.md)
For model download: [PHASE_7_8_GUIDE.md](PHASE_7_8_GUIDE.md)

## Project Status

**Phases Completed:**
- ✅ Phase 1: Project Setup
- ✅ Phase 2: Backend Implementation
- ✅ Phase 3: Worker Implementation  
- ✅ Phase 4: Docker Setup
- ✅ Phase 5: Environment Configuration
- ✅ Phase 6: Initial Testing
- ✅ Phase 7 & 8: Model Setup Documentation

**Next Steps:** Download models and test video generation

## Documentation

- **[QUICK_TEST.md](QUICK_TEST.md)** - 5-minute testing guide (START HERE!)
- **[start.ps1](start.ps1)** - Automated startup script
- **[test_api.ps1](test_api.ps1)** - API testing script
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Comprehensive testing & troubleshooting
- **[PHASE_7_8_GUIDE.md](PHASE_7_8_GUIDE.md)** - Model download & OmniAvatar setup
- **[download_models.ps1](download_models.ps1)** - Windows model download script

**Built with Claude Code**
