"""
Management command to create a superuser if none exists.
Useful for deployment scenarios where you can't access shell interactively.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates a superuser if one does not exist. Uses environment variables for credentials.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username for the superuser',
            default=os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin'),
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the superuser',
            default=os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@example.com'),
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the superuser',
            default=os.getenv('DJANGO_SUPERUSER_PASSWORD', None),
        )
        parser.add_argument(
            '--noinput',
            action='store_true',
            help='Do not prompt for input (use environment variables only)',
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        noinput = options['noinput']

        # Check if superuser already exists
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(
                self.style.SUCCESS(f'Superuser already exists. Skipping creation.')
            )
            return

        # If no password provided and not in noinput mode, prompt
        if not password and not noinput:
            from getpass import getpass
            password = getpass('Password: ')
            password_confirm = getpass('Password (again): ')
            if password != password_confirm:
                self.stdout.write(
                    self.style.ERROR('Passwords do not match. Exiting.')
                )
                return

        # If still no password, generate a random one
        if not password:
            import secrets
            password = secrets.token_urlsafe(16)
            self.stdout.write(
                self.style.WARNING(
                    f'No password provided. Generated random password: {password}'
                )
            )
            self.stdout.write(
                self.style.WARNING('Please change this password after first login!')
            )

        # Create superuser
        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created superuser: {username}'
                )
            )
            if not options.get('password'):
                self.stdout.write(
                    self.style.WARNING(
                        f'Password: {password} (save this securely!)'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            )

