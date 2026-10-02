from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.models import UserProfile
from notifications.services.notification_dispatcher import dispatch_trigger

class Command(BaseCommand):
    help = "Checks user activity and fires inactivity triggers (1 day / 1 week)."

    def handle(self, *args, **options):
        now = timezone.now()
        one_day_ago = now - timedelta(days=1)
        one_week_ago = now - timedelta(days=7)

        # Users inactive between 1 day and 7 days
        inactive_day_profiles = UserProfile.objects.filter(
            last_activity__lte=one_day_ago,
            last_activity__gt=one_week_ago
        )
        self.stdout.write(f"Found {inactive_day_profiles.count()} users inactive for 1 day.")
        for p in inactive_day_profiles:
            dispatch_trigger('not-logged-in-for-1-day', user=p.user)

        # Users inactive > 7 days
        inactive_week_profiles = UserProfile.objects.filter(
            last_activity__lte=one_week_ago
        )
        self.stdout.write(f"Found {inactive_week_profiles.count()} users inactive for 1 week.")
        for p in inactive_week_profiles:
            dispatch_trigger('not-logged-in-for-1-week', user=p.user)

        self.stdout.write(self.style.SUCCESS("Inactivity check completed."))
