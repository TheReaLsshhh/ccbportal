from portal.models import News, Announcement, Event, Achievement

print(f'News with images: {News.objects.exclude(image="").count()}')
print(f'Announcements with images: {Announcement.objects.exclude(image="").count()}')
print(f'Events with images: {Event.objects.exclude(image="").count()}')
print(f'Achievements with images: {Achievement.objects.exclude(image="").count()}')

# Show sample image URLs
news = News.objects.exclude(image="").first()
if news:
    print(f'\nSample News image URL: {news.image.url if news.image else "None"}')

announcement = Announcement.objects.exclude(image="").first()
if announcement:
    print(f'Sample Announcement image URL: {announcement.image.url if announcement.image else "None"}')
