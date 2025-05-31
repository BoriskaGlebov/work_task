from django.test import SimpleTestCase
from django.core.exceptions import ValidationError
from myauth.validators import CustomPasswordValidator  # поправь импорт под себя


class CustomPasswordValidatorTest(SimpleTestCase):
    def setUp(self):
        self.validator = CustomPasswordValidator()

    def test_valid_password_length(self):
        # Пароль длиной 5 символов - валидный
        try:
            self.validator.validate("abcde")
        except ValidationError:
            self.fail("validate() вызвал ValidationError для валидного пароля")

        # Пароль длиной больше 5 символов - валидный
        try:
            self.validator.validate("abcdefgh")
        except ValidationError:
            self.fail("validate() вызвал ValidationError для валидного пароля")

    def test_too_short_password_raises(self):
        with self.assertRaises(ValidationError) as cm:
            self.validator.validate("abc")
        self.assertIn("слишком короткий", str(cm.exception))

    def test_get_help_text(self):
        help_text = self.validator.get_help_text()
        self.assertEqual(help_text, "Пароль должен быть не менее 5 символов.")
