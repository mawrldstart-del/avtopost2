# Telegram AutoPoster Bot

Asynchronous Telegram bot and companion Web API for scheduling and publishing posts to groups or channels. The project is built on top of [`python-telegram-bot`](https://docs.python-telegram-bot.org/) (Bot API wrapper) and `aiohttp`.

## Features
- Telegram bot with `/start`, `/help`, `/stats`, and `/groups` commands.
- SQLite storage for groups, scheduled posts, templates, and statistics.
- APScheduler-based background job that publishes scheduled posts via the [Telegram Bot API](https://core.telegram.org/bots/api).
- REST API (aiohttp) for managing groups, posts, templates, and exporting data to JSON/ZIP.
- Windows launcher (`run.bat`) and Linux helper script (`start.sh`) to simplify local runs.

## Requirements
- Python 3.8 or newer (per python-telegram-bot 20.7 requirements).
- Telegram Bot token obtained from [@BotFather](https://core.telegram.org/bots#6-botfather).
- Optional: HTTPS proxy details if Telegram is blocked in your region.

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/telegram-autoposter.git
cd telegram-autoposter
```

### 2. Create a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure environment variables
Copy the example file and fill it with your BotFather token and optional settings:
```bash
cp .env.example .env
```
Update `.env` with:
- `TELEGRAM_BOT_TOKEN` – the token you received from BotFather.
- `ADMIN_IDS` – comma-separated list of Telegram user IDs allowed to administer the bot.
- `API_PORT` – port for the aiohttp API (default `8080`).
- Optional proxy/timeout settings if you must reach Telegram through a proxy (see comments in `.env.example`).

> ℹ️ The bot reads `.env` automatically on startup. The file is ignored by Git to prevent leaking credentials.

## Running the Bot

### Linux/macOS
Use the helper script after activating your virtual environment:
```bash
./start.sh
```
The script verifies dependencies, checks that `.env` contains a real token, and pipes logs to `logs/bot.log`. You can also run the bot manually with `python3 bot.py`.

### Windows (Command Prompt)
Run the launcher, which creates/activates a virtual environment and starts the bot with logging:
```bat
run.bat
```
If dependency installation fails, rerun `venv\Scripts\pip.exe install -r requirements.txt` and launch again.

## Web API Overview
The aiohttp application listens on `API_PORT` (default `8080`) and exposes JSON endpoints:

| Method | Path             | Description                             |
| ------ | ---------------- | --------------------------------------- |
| GET    | `/api/health`    | Returns bot status and timestamp.       |
| GET    | `/api/stats`     | Aggregated counters for groups/posts.   |
| GET    | `/api/groups`    | List of configured groups/channels.     |
| POST   | `/api/groups`    | Add a new group (expects JSON payload). |
| GET    | `/api/posts`     | List scheduled/published posts.         |
| POST   | `/api/posts`     | Schedule a new post.                    |
| GET    | `/api/templates` | List post templates.                    |
| POST   | `/api/templates` | Create a template.                      |
| POST   | `/api/export`    | Export DB snapshots to JSON.            |
| GET    | `/api/download`  | Download a ZIP with project assets.     |

All write endpoints expect JSON bodies and respond with structured success/error payloads. Authentication/authorization should be added before exposing the API to the public internet.

## Working with Telegram Bot API
- Bots must be invited as administrators to target groups/channels before they can post. See the [Telegram Bot API documentation on chat administrators](https://core.telegram.org/bots/api#chatmember) for required rights.
- Bots cannot initiate chats with users; they can only respond after the user presses “Start” as per [Telegram’s privacy rules](https://core.telegram.org/bots#privacy-mode).
- The project uses long polling (`Application.updater.start_polling()`) to receive updates. You can adapt the implementation to webhooks by providing `webhook_url` handling in `BotConfig` if needed.
- Messages are sent with `parse_mode='HTML'`, so ensure your templates use valid HTML tags supported by Telegram.

## Downloading the Project Bundle
You can fetch a ZIP archive generated on demand with all key backend/frontend files:

- Browser: open `https://your-server-hostname/api/download`.
- PowerShell:
  ```powershell
  Invoke-WebRequest -Uri "https://your-server-hostname/api/download" -OutFile "autoposter.zip"
  Expand-Archive -Path "autoposter.zip" -DestinationPath "autoposter"
  ```
- curl:
  ```bash
  curl -L "https://your-server-hostname/api/download" -o autoposter.zip
  unzip autoposter.zip -d autoposter
  ```

Replace `your-server-hostname` with the host/IP where the bot is running.

## Troubleshooting
- **Missing dependencies** – the startup preflight in `bot.py` exits with a helpful message if a required package is absent. Install everything with `pip install -r requirements.txt`.
- **Invalid token** – Telegram returns `Unauthorized`. Double-check the token in `.env` and regenerate it with BotFather if necessary.
- **Network/proxy errors** – set `TELEGRAM_PROXY_URL` and timeout overrides if Telegram is blocked by your ISP, or ensure outbound HTTPS traffic is allowed.
- **Port already in use** – change `API_PORT` to a free port; the bot checks availability before binding the aiohttp server.

## License
MIT License. See `LICENSE` for details.


