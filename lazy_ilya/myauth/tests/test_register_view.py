from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse

from myauth.models import CustomUser


class RegisterAjaxViewTest(TestCase):
    def setUp(self):
        self.register_url = reverse('myauth:registration')
        self.redirect_url = reverse('file_creator:file-creator-start')
        self.group = Group.objects.create(name='ilia-group')

    def get_valid_data(self):
        return {
            'username': 'newuser',
            'first_name': 'Илья',
            'last_name': 'Ленивый',
            'phone_number': '+79998887766',
            'email': 'newuser@example.com',
            'password1': 'securepass123',
            'password2': 'securepass123'
        }

    def test_register_success_ajax(self):
        response = self.client.post(
            self.register_url,
            data=self.get_valid_data(),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            str(response.content, encoding='utf8'),
            {'success': True, 'redirect_url': self.redirect_url}
        )
        self.assertTrue(CustomUser.objects.filter(username='newuser').exists())
        user = CustomUser.objects.get(username='newuser')
        self.assertTrue(user.groups.filter(name='ilia-group').exists())
        self.assertTrue('_auth_user_id' in self.client.session)

    def test_register_failure_ajax(self):
        data = self.get_valid_data()
        data['password2'] = 'wrongpass'
        response = self.client.post(
            self.register_url,
            data=data,
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.json())
        self.assertFalse(response.json()['success'])

    def test_register_success_regular_post(self):
        response = self.client.post(self.register_url, data=self.get_valid_data())
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, self.redirect_url)
        self.assertTrue(CustomUser.objects.filter(username='newuser').exists())

    def test_user_added_to_group(self):
        self.client.post(
            self.register_url,
            data=self.get_valid_data(),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        user = CustomUser.objects.get(username='newuser')
        self.assertTrue(user.groups.filter(name='ilia-group').exists())

    def test_user_logged_in_after_register(self):
        self.client.post(
            self.register_url,
            data=self.get_valid_data(),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertTrue('_auth_user_id' in self.client.session)
