from django.test import TestCase

from myauth.forms import CustomUserCreationForm, PasswordResetForm
from myauth.models import CustomUser


class CustomUserCreationFormTests(TestCase):
    def test_valid_data(self):
        form = CustomUserCreationForm(
            data={
                "username": "testuser",
                "first_name": "Имя",
                "last_name": "Фамилия",
                "phone_number": "+79991112233",
                "email": "user@example.com",
                "password1": "securepass123",
                "password2": "securepass123",
            }
        )
        self.assertTrue(form.is_valid())

    def test_passwords_do_not_match(self):
        form = CustomUserCreationForm(
            data={
                "username": "testuser",
                "first_name": "Имя",
                "last_name": "Фамилия",
                "phone_number": "+79991112233",
                "email": "user@example.com",
                "password1": "securepass123",
                "password2": "differentpass",
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn("password2", form.errors)
        self.assertIn("Кожаный", form.errors["password2"][0])

    def test_duplicate_phone_number(self):
        CustomUser.objects.create_user(
            username="existinguser", phone_number="+79991112233", password="somepass123"
        )
        form = CustomUserCreationForm(
            data={
                "username": "testuser",
                "first_name": "Имя",
                "last_name": "Фамилия",
                "phone_number": "+79991112233",
                "email": "user@example.com",
                "password1": "securepass123",
                "password2": "securepass123",
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn("phone_number", form.errors)


class PasswordResetFormTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="resetuser", phone_number="+79991112233", password="oldpass123"
        )

    def test_valid_data(self):
        form = PasswordResetForm(
            data={
                "username": "resetuser",
                "phone_number": "+79991112233",
                "password1": "newpass123",
                "password2": "newpass123",
            }
        )
        self.assertTrue(form.is_valid())

    def test_passwords_do_not_match(self):
        form = PasswordResetForm(
            data={
                "username": "resetuser",
                "phone_number": "+79991112233",
                "password1": "newpass123",
                "password2": "otherpass",
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn("password2", form.errors)
        self.assertIn("Кожаный", form.errors["password2"][0])

    def test_short_password(self):
        form = PasswordResetForm(
            data={
                "username": "resetuser",
                "phone_number": "+79991112233",
                "password1": "123",
                "password2": "123",
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn("password1", form.errors)
        self.assertIn("Длина пароля", form.errors["password1"][0])

    def test_user_not_found(self):
        form = PasswordResetForm(
            data={
                "username": "nouser",
                "phone_number": "+79991112233",
                "password1": "newpass123",
                "password2": "newpass123",
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn("username", form.errors)
        self.assertIn("не найдет", form.errors["username"][0])
