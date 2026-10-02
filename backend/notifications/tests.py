from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from notifications.models import Trigger, ChannelTemplate, NotificationLog, UserProfile
from notifications.services.notification_dispatcher import dispatch_trigger, render_template_string

class NotificationEngineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password123")
        self.profile = UserProfile.objects.create(user=self.user, phone_number="+1234567890")

        # Create sample Trigger
        self.trigger = Trigger.objects.create(name="Login", slug="login", description="User logs in")
        
        # Create 3 Channel Templates
        self.tmpl_wa = ChannelTemplate.objects.create(
            trigger=self.trigger,
            channel="whatsapp",
            is_enabled=True,
            title="Welcome",
            body="Welcome back, {{username}}!"
        )
        self.tmpl_email = ChannelTemplate.objects.create(
            trigger=self.trigger,
            channel="email",
            is_enabled=True,
            title="Login Notice",
            body="Hello {{username}}, you logged in at {{time}}."
        )
        self.tmpl_push = ChannelTemplate.objects.create(
            trigger=self.trigger,
            channel="web_push",
            is_enabled=True,
            title="Push Welcome",
            body="Welcome {{username}}"
        )

    def test_placeholder_rendering(self):
        ctx = {"username": "Alice", "time": "2026-09-30 12:00:00"}
        rendered = render_template_string("Hello {{username}} at {{time}}", ctx)
        self.assertEqual(rendered, "Hello Alice at 2026-09-30 12:00:00")

    def test_trigger_dispatch(self):
        result = dispatch_trigger("login", user=self.user)
        self.assertTrue(result["success"])
        self.assertIn("whatsapp", result["results"])
        self.assertIn("email", result["results"])
        self.assertIn("web_push", result["results"])
        
        # Verify NotificationLog entries were written
        logs = NotificationLog.objects.filter(trigger=self.trigger)
        self.assertEqual(logs.count(), 3)

    def test_toggle_channel_off(self):
        # Toggle email OFF
        url = f"/api/templates/{self.tmpl_email.id}/toggle/"
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        
        self.tmpl_email.refresh_from_db()
        self.assertFalse(self.tmpl_email.is_enabled)

        # Dispatch trigger again: Email should be skipped
        result = dispatch_trigger("login", user=self.user)
        self.assertEqual(result["results"]["email"]["status"], "skipped")

    def test_edit_template(self):
        url = f"/api/templates/{self.tmpl_email.id}/"
        payload = {"body": "Updated template text for {{username}}"}
        resp = self.client.patch(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.tmpl_email.refresh_from_db()
        self.assertEqual(self.tmpl_email.body, "Updated template text for {{username}}")

    def test_api_matrix_listing(self):
        resp = self.client.get("/api/triggers/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertGreaterEqual(len(data), 1)
        self.assertIn("template_matrix", data[0])
        self.assertIn("whatsapp", data[0]["template_matrix"])
        self.assertIn("email", data[0]["template_matrix"])
        self.assertIn("web_push", data[0]["template_matrix"])

    def test_test_send_endpoint(self):
        url = f"/api/templates/{self.tmpl_wa.id}/test-send/"
        resp = self.client.post(url, {"recipient": "+19876543210"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.json()["success"])
