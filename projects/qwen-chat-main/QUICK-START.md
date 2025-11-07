# 🚀 Qwen Chat Quick Start

## Environment Configuration

### Local Development

For local development, configure `frontend/.env.local`:

```bash
# Backend API configuration
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Production / Remote Access

For production or remote access via Cloudflare Tunnel:

```bash
# Backend API configuration
NEXT_PUBLIC_API_BASE=https://api.mrqwen.us
NEXT_PUBLIC_BACKEND_URL=https://api.mrqwen.us
```

**Note**: The `.env.local` file is gitignored and must be created manually on each deployment.

---

## Install Auto-Start (One Command)

```bash
cd /Users/ekodevapps/projects/qwen-chat-main && ./install-auto-start.sh
```

**This will make the frontend start automatically whenever:**
- Your Mac boots up
- Someone accesses mrqwen.us
- The service crashes (auto-recovery)

---

## Daily Use

### Start All Services
```bash
./start-servers.sh start
```

### Check Status
```bash
./start-servers.sh status
```

### Stop All Services
```bash
./start-servers.sh stop
```

---

## Service Management

### Check if auto-start is installed
```bash
launchctl list | grep qwen
```

### View logs
```bash
tail -f logs/launchd-frontend.log
```

### Uninstall auto-start
```bash
./uninstall-auto-start.sh
```

---

## Access Points

- **Local**: http://localhost:3000
- **Public**: https://mrqwen.us

---

## Files Created

| File | Purpose |
|------|---------|
| `install-auto-start.sh` | Install auto-start service |
| `uninstall-auto-start.sh` | Remove auto-start service |
| `check-and-start-frontend.sh` | Health check script |
| `com.qwen.frontend.plist` | macOS LaunchAgent config |
| `start-servers.sh` | Manual server control |
| `AUTO-START-GUIDE.md` | Full documentation |

---

## Need Help?

Read `AUTO-START-GUIDE.md` for detailed documentation and troubleshooting.
