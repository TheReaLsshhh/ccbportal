"""
Django management command to fix broken image paths in the database.

This command will:
1. Find all records with image fields that point to non-existent files
2. Try to match them with actual files in the media directory
3. Update the database with correct filenames

Usage:
    python manage.py fix_image_paths
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from portal.models import Announcement, Event, Achievement, News
import os
from pathlib import Path
from difflib import SequenceMatcher


class Command(BaseCommand):
    help = 'Fix broken image paths in the database by matching with actual files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be fixed without actually updating the database',
        )
        parser.add_argument(
            '--similarity',
            type=float,
            default=0.6,
            help='Minimum similarity threshold for filename matching (0.0-1.0, default: 0.6)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        similarity_threshold = options['similarity']

        self.stdout.write(self.style.SUCCESS('Starting image path fix...\n'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made\n'))

        # Get media root path
        media_root = settings.MEDIA_ROOT
        
        total_fixed = 0
        total_broken = 0
        
        # Process each model
        models_to_check = [
            (Announcement, 'announcements'),
            (Event, 'events'),
            (Achievement, 'achievements'),
            (News, 'news'),
        ]
        
        for model_class, folder_name in models_to_check:
            self.stdout.write(f'\n{self.style.HTTP_INFO}Checking {model_class.__name__}...')
            fixed, broken = self.fix_model_images(
                model_class, 
                folder_name, 
                media_root, 
                dry_run,
                similarity_threshold
            )
            total_fixed += fixed
            total_broken += broken
        
        # Print summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'\nSummary:'))
        self.stdout.write(f'  Fixed: {total_fixed}')
        self.stdout.write(f'  Still broken: {total_broken}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nThis was a DRY RUN. Run without --dry-run to apply changes.'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ Done!'))

    def fix_model_images(self, model_class, folder_name, media_root, dry_run, similarity_threshold):
        """Fix images for a specific model"""
        fixed_count = 0
        broken_count = 0
        
        # Get all records with images
        records = model_class.objects.exclude(image='').exclude(image__isnull=True)
        
        if not records.exists():
            self.stdout.write(f'  No {model_class.__name__} records with images.')
            return 0, 0
        
        # Get all actual files in the media folder
        folder_path = os.path.join(media_root, folder_name)
        if not os.path.exists(folder_path):
            self.stdout.write(self.style.WARNING(f'  Folder not found: {folder_path}'))
            return 0, 0
        
        actual_files = set()
        for file in os.listdir(folder_path):
            if os.path.isfile(os.path.join(folder_path, file)):
                actual_files.add(file)
        
        self.stdout.write(f'  Found {len(actual_files)} files in {folder_name}/')
        
        # Check each record
        for record in records:
            if not record.image:
                continue
            
            # Get the expected file path
            image_path = record.image.name  # e.g., 'announcements/filename.jpg'
            full_path = os.path.join(media_root, image_path)
            
            # Check if file exists
            if os.path.exists(full_path):
                # File exists, nothing to do
                continue
            
            # File doesn't exist - try to find a match
            broken_count += 1
            filename = os.path.basename(image_path)
            
            self.stdout.write(f'\n  ❌ Broken: {record.id} - "{record.title[:50]}"')
            self.stdout.write(f'     Expected: {filename}')
            
            # Try to find a similar filename
            best_match = self.find_best_match(filename, actual_files, similarity_threshold)
            
            if best_match:
                similarity = self.similarity(filename, best_match)
                self.stdout.write(self.style.SUCCESS(
                    f'     ✓ Found match: {best_match} (similarity: {similarity:.2%})'
                ))
                
                if not dry_run:
                    # Update the database
                    new_path = os.path.join(folder_name, best_match)
                    record.image.name = new_path
                    record.save(update_fields=['image'])
                    self.stdout.write(f'     ✅ Updated database')
                
                fixed_count += 1
                broken_count -= 1
            else:
                self.stdout.write(self.style.ERROR(
                    f'     ✗ No similar file found (threshold: {similarity_threshold:.0%})'
                ))
        
        return fixed_count, broken_count

    def similarity(self, a, b):
        """Calculate similarity between two strings"""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def find_best_match(self, filename, available_files, threshold=0.6):
        """Find the best matching filename from available files"""
        best_match = None
        best_score = 0
        
        for available_file in available_files:
            score = self.similarity(filename, available_file)
            if score > best_score and score >= threshold:
                best_score = score
                best_match = available_file
        
        return best_match
