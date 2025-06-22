from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import TestCase

User = get_user_model()


class CustomPasswordResetViewTests(TestCase):
    def setUp(self):
        self.reset_url = reverse(
            "myauth:reset-password"
        )  # Обнови на актуальный name, если другой
        self.login_url = reverse("myauth:login")

        self.user = User.objects.create_user(
            username="reset_user",
            email="reset@example.com",
            phone_number="+79991112233",
            password="old_password",
        )

    def test_reset_password_success_ajax(self):
        data = {
            "username": "reset_user",
            "phone_number": "+79991112233",
            "password1": "new_secure_pass123",
            "password2": "new_secure_pass123",
        }
        response = self.client.post(
            self.reset_url, data=data, HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            str(response.content, encoding="utf8"),
            {"success": True, "redirect_url": self.login_url},
        )

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new_secure_pass123"))

    def test_reset_password_failure_ajax(self):
        data = {
            "username": "reset_user",
            "phone_number": "+79991112233",
            "password1": "short",
            "password2": "mismatch",
        }
        response = self.client.post(
            self.reset_url, data=data, HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("errors", response.json())
        self.assertFalse(response.json()["success"])

    def test_reset_password_regular_post_success(self):
        data = {
            "username": "reset_user",
            "phone_number": "+79991112233",
            "password1": "validpassword123",
            "password2": "validpassword123",
        }
        response = self.client.post(self.reset_url, data=data)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.login_url)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("validpassword123"))

    def test_user_not_found(self):
        data = {
            "username": "reset_user",
            "phone_number": "+79991112266",
            "password1": "something123",
            "password2": "something123",
        }
        response = self.client.post(
            self.reset_url, data=data, HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("errors", response.json())
        self.assertIn("username", response.json()["errors"])
