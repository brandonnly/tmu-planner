# TMU Planner Scraper

The TMU Planner Scraper is a Python-based web scraping service designed to collect and process course data from Toronto Metropolitan University's course catalog. This data is then used to power the TMU Planner application.

## Requirements

- Python 3.13 or higher
- A virtual environment manager (recommended: `uv` or `venv`)

## Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Unix/macOS
   # OR
   .venv\Scripts\activate  # On Windows
   ```

2. Install dependencies:

   ```bash
   uv pip install -r requirements.txt
   ```

## Project Structure

```
scraper/
├── README.md           # This file
├── pyproject.toml      # Project configuration and dependencies
├── main.py            # Main scraper entry point
└── .python-version    # Python version specification
```

## Usage

To run the scraper:

```bash
python main.py
```
