from portal.models import Announcement, Event, Achievement, News
import os
from django.conf import settings

print("\n" + "="*60)
print("CHECKING IMAGE FILES")
print("="*60)

models = [
    (Announcement, 'announcements'),
    (Event, 'events'),
    (Achievement, 'achievements'),
    (News, 'news'),
]

media_root = settings.MEDIA_ROOT
total_broken = 0

for model_class, folder_name in models:
    print(f"\n{model_class.__name__}:")
    records = model_class.objects.exclude(image='').exclude(image__isnull=True)
    
    for record in records:
        if record.image:
            full_path = os.path.join(media_root, record.image.name)
            exists = os.path.exists(full_path)
            status = "✅" if exists else "❌"
            
            if not exists:
                total_broken += 1
                print(f"  {status} ID {record.id}: {record.title[:40]}")
                print(f"      Path: {record.image.name}")
                print(f"      Expected: {full_path}")

print(f"\n" + "="*60)
print(f"Total broken images: {total_broken}")
print("="*60)
