from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

width, height = 1800, 1100
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img)
font_title = ImageFont.load_default()
font_text = ImageFont.load_default()

# Title
text = 'Level 1 Data Flow Diagram - Sahachari Delivery'
# simple centered title using approximate width
bbox = draw.textbbox((0, 0), text, font=font_title)
text_w = bbox[2] - bbox[0]
text_x = (width - text_w) // 2
draw.text((text_x, 40), text, fill='black', font=font_title)

# Boxes
boxes = [
    (120, 220, 380, 320, 'User / Customer\nInterface'),
    (500, 220, 780, 320, 'Authentication\nModule'),
    (860, 220, 1140, 320, 'Order Management\nModule'),
    (1220, 220, 1500, 320, 'Payment\nModule'),
    (680, 430, 960, 530, 'Tracking /\nStatus Module'),
    (1040, 430, 1320, 530, 'Profile /\nSettings Module'),
    (700, 760, 1000, 870, 'User Database'),
    (1060, 760, 1360, 870, 'Order / Payment\nDatabase'),
]
for x1, y1, x2, y2, label in boxes:
    draw.rectangle([x1, y1, x2, y2], outline='black', width=2)
    bbox = draw.textbbox((0, 0), label, font=font_text)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    tx = (x1 + x2 - text_w) // 2
    ty = (y1 + y2 - text_h) // 2
    draw.text((tx, ty), label, fill='black', font=font_text)

# Arrows and labels
lines = [
    ((380, 270), (500, 270), 'Login / Request'),
    ((780, 270), (860, 270), 'Order Data'),
    ((1140, 270), (1220, 270), 'Payment Details'),
    ((1000, 320), (820, 430), 'Tracking Info'),
    ((1000, 320), (1180, 430), 'Profile Data'),
    ((820, 530), (850, 760), 'User Records'),
    ((1180, 530), (1210, 760), 'Order & Payment Records'),
    ((700, 760), (640, 320), 'User Records'),
    ((1060, 760), (1360, 320), 'Order & Payment Records'),
]
for (x1, y1), (x2, y2), label in lines:
    draw.line([(x1, y1), (x2, y2)], fill='black', width=2)
    # arrow head
    draw.polygon([(x2, y2), (x2-12, y2-6), (x2-12, y2+6)], fill='black')
    draw.text((x1 + 10, y1 - 20), label, fill='black', font=font_text)

out = Path('data_flow_diagram_level1.png')
img.save(out)
print(out.name)
