from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Creates a superuser automatically if it does not exist'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Get credentials from environment or use defaults
        username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'ccbadmin')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'ccbadmin@edu.com')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'ccbadmin@edu123')
        
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created successfully!'))
        else:
            self.stdout.write(self.style.WARNING(f'Superuser "{username}" already exists.'))