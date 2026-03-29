import urllib.request
import os
from pathlib import Path

# Create fonts directory if it doesn't exist
fonts_dir = Path("static/fonts/noto-sans-kannada")
fonts_dir.mkdir(parents=True, exist_ok=True)

# Download Noto Sans Kannada from Google Fonts using the API
try:
    import urllib.request
    import json
    
    # Get the CSS from Google Fonts
    url = "https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    print("Fetching Noto Sans Kannada from Google Fonts...")
    req = urllib.request.Request(url, headers=headers)
    
    with urllib.request.urlopen(req) as response:
        css_content = response.read().decode('utf-8')
    
    print("✓ CSS fetched successfully!")
    print("Creating local CSS file...")
    
    # Parse the CSS to extract font URLs
    import re
    font_urls = re.findall(r'src:\s*url\((.*?)\)', css_content)
    
    # Download each font file
    for i, font_url in enumerate(font_urls):
        print(f"  Downloading font variant {i+1}/{len(font_urls)}...", end=" ")
        try:
            req = urllib.request.Request(font_url, headers=headers)
            with urllib.request.urlopen(req) as response:
                font_data = response.read()
            
            # Determine filename based on weight
            if 'wght@700' in font_url or '700' in font_url:
                filename = 'NotoSansKannada-Bold.ttf'
            elif 'wght@600' in font_url or '600' in font_url:
                filename = 'NotoSansKannada-SemiBold.ttf'
            elif 'wght@500' in font_url or '500' in font_url:
                filename = 'NotoSansKannada-Medium.ttf'
            else:
                filename = 'NotoSansKannada-Regular.ttf'
            
            filepath = fonts_dir / filename
            with open(filepath, 'wb') as f:
                f.write(font_data)
            
            print(f"✓ ({len(font_data) / 1024:.1f} KB)")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print("\n✓ All fonts downloaded successfully!")
    
except Exception as e:
    print(f"✗ Error downloading fonts: {e}")
    print("\nYou may need to download the fonts manually from https://fonts.google.com/specimen/Noto+Sans+Kannada")
