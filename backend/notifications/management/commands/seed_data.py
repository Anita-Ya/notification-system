from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from notifications.models import Trigger, ChannelTemplate, UserProfile

class Command(BaseCommand):
    help = "Seeds initial triggers, channel templates, and demo admin user for the notification system."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding notification system data..."))

        # 1. Create Default Admin User
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@example.com",
                "is_staff": True,
                "is_superuser": True
            }
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created admin user: admin / admin123"))
        else:
            self.stdout.write("Admin user already exists.")

        profile, _ = UserProfile.objects.get_or_create(user=admin_user)
        if not profile.phone_number:
            profile.phone_number = "+1234567890"
            profile.save()

        # 2. Trigger definitions according to prompt specifications
        triggers_data = [
            {
                "name": "Login",
                "slug": "login",
                "description": "Fires when user signs in on the website",
                "templates": {
                    "whatsapp": {
                        "title": "Login Alert",
                        "body": "Welcome back, {{username}}! Great to have you back on our platform. 🚀",
                        "meta_template_name": "welcome_back_login"
                    },
                    "email": {
                        "title": "You logged in successfully",
                        "body": "Hello {{username}},\n\nYou have successfully logged in to your account at {{time}}.\n\nIf you did not initiate this login, please reset your password immediately."
                    },
                    "web_push": {
                        "title": "Welcome back!",
                        "body": "You are logged in successfully. Explore your dashboard!",
                        "extra_config": {"url": "/dashboard"}
                    }
                }
            },
            {
                "name": "Logout",
                "slug": "logout",
                "description": "Fires when user signs out of their session",
                "templates": {
                    "whatsapp": {
                        "title": "Logout Confirmation",
                        "body": "Goodbye for now, {{username}}. You have been safely logged out. See you soon! 👋",
                        "meta_template_name": "user_logout_notice"
                    },
                    "email": {
                        "title": "Security Notice: Account Logout",
                        "body": "Hi {{username}},\n\nYour account session ended at {{time}}.\nThank you for visiting today."
                    },
                    "web_push": {
                        "title": "Signed Out",
                        "body": "You have been safely signed out. Click to log back in anytime.",
                        "extra_config": {"url": "/login"}
                    }
                }
            },
            {
                "name": "Not logged in for 1 day",
                "slug": "not-logged-in-for-1-day",
                "description": "User has not visited the website for 24 hours",
                "templates": {
                    "whatsapp": {
                        "title": "Daily Catch-up",
                        "body": "Hey {{username}}, we noticed you haven't checked in today. Discover what's new on your feed! 📈",
                        "meta_template_name": "daily_checkin_reminder"
                    },
                    "email": {
                        "title": "We miss you! See what's new today",
                        "body": "Hi {{username}},\n\nIt's been 24 hours since your last visit. We've got fresh updates and notifications waiting for you."
                    },
                    "web_push": {
                        "title": "Daily Catch-up",
                        "body": "It's been 24 hours since your last visit. Jump back in!",
                        "extra_config": {"url": "/"}
                    }
                }
            },
            {
                "name": "Not logged in for 1 week",
                "slug": "not-logged-in-for-1-week",
                "description": "User has not visited for 7 days",
                "templates": {
                    "whatsapp": {
                        "title": "We miss you",
                        "body": "We miss you, {{username}}! Come back and explore exciting updates tailored for you. 🌟",
                        "meta_template_name": "weekly_reengagement"
                    },
                    "email": {
                        "title": "It's been a week...",
                        "body": "Hello {{username}},\n\nIt has been a full week since you last visited. Log in today to keep your account streak active!"
                    },
                    "web_push": {
                        "title": "Come visit us again",
                        "body": "It's been a week since your last visit. Come check what's new.",
                        "extra_config": {"url": "/"}
                    }
                }
            },
            {
                "name": "Password reset",
                "slug": "password-reset",
                "description": "User asks to reset password",
                "templates": {
                    "whatsapp": {
                        "title": "Password Reset Alert",
                        "body": "Security Alert: A password reset request was initiated for your account at {{time}}.",
                        "meta_template_name": "auth_password_reset"
                    },
                    "email": {
                        "title": "Password Reset Instructions",
                        "body": "Hello {{username}},\n\nWe received a request to reset your password on {{time}}.\nIf you did not request this, please ignore this email."
                    },
                    "web_push": {
                        "title": "Password Reset Request",
                        "body": "Check your email for password reset verification link.",
                        "extra_config": {"url": "/reset"}
                    }
                }
            },
            {
                "name": "Order placed",
                "slug": "order-placed",
                "description": "User completes a purchase",
                "templates": {
                    "whatsapp": {
                        "title": "Order Confirmed",
                        "body": "Woohoo! Order #{{order_id}} confirmed! Thank you {{username}} for your purchase. We are preparing it now! 📦",
                        "meta_template_name": "order_confirmed_notice"
                    },
                    "email": {
                        "title": "Your Order #{{order_id}} is Confirmed!",
                        "body": "Dear {{username}},\n\nThank you for shopping with us! Your order #{{order_id}} was placed on {{time}}.\nWe will notify you once dispatched."
                    },
                    "web_push": {
                        "title": "Order Placed Successfully!",
                        "body": "Your order #{{order_id}} has been received. Thank you!",
                        "extra_config": {"url": "/orders"}
                    }
                }
            }
        ]

        for trig_info in triggers_data:
            trigger, t_created = Trigger.objects.get_or_create(
                slug=trig_info["slug"],
                defaults={
                    "name": trig_info["name"],
                    "description": trig_info["description"],
                    "is_active": True
                }
            )
            action_verb = "Created" if t_created else "Updated"
            self.stdout.write(f"{action_verb} Trigger: {trigger.name}")

            for channel, tmpl_info in trig_info["templates"].items():
                ChannelTemplate.objects.update_or_create(
                    trigger=trigger,
                    channel=channel,
                    defaults={
                        "is_enabled": True,
                        "title": tmpl_info.get("title", f"{trigger.name} Notification"),
                        "body": tmpl_info.get("body", ""),
                        "meta_template_name": tmpl_info.get("meta_template_name", ""),
                        "status": "approved",
                        "extra_config": tmpl_info.get("extra_config", {})
                    }
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded triggers and channel templates!"))
