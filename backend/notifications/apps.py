from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notification Management System'

    def ready(self):
        # Fix Python 3.14 compatibility with Django 4.2 BaseContext.__copy__
        try:
            from django.template import context
            def _patched_base_context_copy(self):
                duplicate = self.__class__.__new__(self.__class__)
                duplicate.dicts = self.dicts[:]
                return duplicate
            context.BaseContext.__copy__ = _patched_base_context_copy
        except Exception:
            pass
