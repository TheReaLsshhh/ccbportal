# Generated migration for adding image field to Event model

from django.db import migrations, models, connection


def add_image_field_if_not_exists(apps, schema_editor):
    """Add image column only if it doesn't exist"""
    with connection.cursor() as cursor:
        # Check if the column exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'portal_event' 
            AND COLUMN_NAME = 'image'
        """)
        column_exists = cursor.fetchone()[0] > 0
        
        if not column_exists:
            # Add the column using schema_editor to ensure proper field creation
            Event = apps.get_model('portal', 'Event')
            field = models.ImageField(blank=True, null=True, upload_to='events/')
            field.set_attributes_from_name('image')
            schema_editor.add_field(Event, field)


def remove_image_field_if_exists(apps, schema_editor):
    """Remove image column if it exists"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'portal_event' 
            AND COLUMN_NAME = 'image'
        """)
        column_exists = cursor.fetchone()[0] > 0
        
        if column_exists:
            Event = apps.get_model('portal', 'Event')
            field = models.ImageField(blank=True, null=True, upload_to='events/')
            field.set_attributes_from_name('image')
            schema_editor.remove_field(Event, field)


class AddFieldIfNotExists(migrations.AddField):
    """Custom AddField that checks if column exists before adding"""
    
    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        model = to_state.apps.get_model(app_label, self.model_name)
        if self.allow_migrate_model(schema_editor.connection.alias, model):
            # Check if column already exists
            with schema_editor.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = %s 
                    AND COLUMN_NAME = %s
                """, [model._meta.db_table, self.name])
                column_exists = cursor.fetchone()[0] > 0
                
                if not column_exists:
                    # Only add if it doesn't exist
                    super().database_forwards(app_label, schema_editor, from_state, to_state)


class Migration(migrations.Migration):

    dependencies = [
        ('portal', '0019_institutionalinfo'),
    ]

    operations = [
        # Use custom AddField that checks for existence
        AddFieldIfNotExists(
            model_name='event',
            name='image',
            field=models.ImageField(blank=True, help_text='Event image', null=True, upload_to='events/'),
        ),
    ]

