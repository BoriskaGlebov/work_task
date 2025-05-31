from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

User = get_user_model()


class LoginAjaxViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser123", password="securepass123"
        )
        self.login_url = reverse("myauth:login")
        self.redirect_url = reverse("file_creator:file-creator-start")

    def test_login_success_ajax(self):
        response = self.client.post(
            self.login_url,
            data={"username": "testuser123", "password": "securepass123"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            str(response.content, encoding="utf8"),
            {"success": True, "redirect_url": self.redirect_url},
        )

    def test_login_failure_ajax(self):
        response = self.client.post(
            self.login_url,
            data={"username": "testuser123", "password": "wrongpassword"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("errors", response.json())
        self.assertFalse(response.json()["success"])

    def test_login_success_regular(self):
        response = self.client.post(
            self.login_url,
            data={"username": "testuser123", "password": "securepass123"},
        )
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.redirect_url)

    def test_login_failure_regular(self):
        response = self.client.post(
            self.login_url,
            data={"username": "testuser123", "password": "wrongpassword"},
        )
        self.assertEqual(response.status_code, 200)
        # self.assertContains(response, "Please enter a correct username and password")
