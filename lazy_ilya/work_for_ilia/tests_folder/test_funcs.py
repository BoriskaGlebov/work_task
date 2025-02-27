import json

from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User, Group, Permission, AnonymousUser
from django.contrib.auth.decorators import user_passes_test
from django.urls import reverse

from work_for_ilia.models import SomeDataFromSomeTables, SomeTables
from work_for_ilia.views import group_or_superuser_required, is_ajax, city_form_view, check_record_exists, \
    get_next_dock_num
from django.http import HttpResponse


class TestGroupOrSuperuserRequired(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.group_name = "test_group"
        self.group = Group.objects.create(name=self.group_name)

        # Создаем суперпользователя
        self.superuser = User.objects.create_superuser('superuser', 'super@example.com', 'password')

        # Создаем пользователя в группе
        self.user_in_group = User.objects.create_user('user_in_group', 'user@example.com', 'password')
        self.user_in_group.groups.add(self.group)

        # Создаем пользователя не в группе и не суперпользователя
        self.user_not_in_group = User.objects.create_user('user_not_in_group', 'not_in_group@example.com', 'password')

    def test_superuser(self):
        # Создаем запрос от суперпользователя
        request = self.factory.get('/')
        request.user = self.superuser

        # Применяем декоратор
        @group_or_superuser_required(self.group_name)
        def view(request):
            return HttpResponse("Доступ разрешен")

        response = view(request)
        self.assertEqual(response.status_code, 200)

    def test_user_in_group(self):
        # Создаем запрос от пользователя в группе
        request = self.factory.get('/')
        request.user = self.user_in_group

        # Применяем декоратор
        @group_or_superuser_required(self.group_name)
        def view(request):
            return HttpResponse("Доступ разрешен")

        response = view(request)
        self.assertEqual(response.status_code, 200)

    def test_user_not_in_group(self):
        # Создаем запрос от пользователя не в группе
        request = self.factory.get('/')
        request.user = self.user_not_in_group

        # Применяем декоратор
        @group_or_superuser_required(self.group_name)
        def view(request):
            return HttpResponse("Доступ разрешен")

        response = view(request)
        self.assertEqual(response.status_code, 302)  # Перенаправление на страницу входа

    def test_anonymous_user(self):
        # Создаем запрос от анонимного пользователя
        request = self.factory.get('/')
        request.user = AnonymousUser()

        # Применяем декоратор
        @group_or_superuser_required(self.group_name)
        def view(request):
            return HttpResponse("Доступ разрешен")

        response = view(request)
        self.assertEqual(response.status_code, 302)  # Перенаправление на страницу входа


class TestIsAjax(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_ajax_request(self):
        request = self.factory.get('/')
        request.META['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest'
        self.assertTrue(is_ajax(request))

    def test_non_ajax_request(self):
        request = self.factory.get('/')
        self.assertFalse(is_ajax(request))


class TestCityFormView(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.group_name = "admins"
        self.group = Group.objects.create(name=self.group_name)

        # Создаем суперпользователя
        self.superuser = User.objects.create_superuser('superuser', 'super@example.com', 'password')

        # Создаем пользователя в группе
        self.user_in_group = User.objects.create_user('user_in_group', 'user@example.com', 'password')
        self.user_in_group.groups.add(self.group)

        # Создаем пользователя не в группе и не суперпользователя
        self.user_not_in_group = User.objects.create_user('user_not_in_group', 'not_in_group@example.com', 'password')

    def test_get_request(self):
        # Создаем GET-запрос от суперпользователя
        request = self.factory.get(reverse('work_for_ilia:city_cr_or_upd'))
        request.user = self.superuser

        response = city_form_view(request)
        self.assertEqual(response.status_code, 200)

    def test_post_request_valid_form(self):
        # Создаем POST-запрос от суперпользователя с валидной формой
        table1 = SomeTables.objects.create(table_name='test_table_name')
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num=2)
        post_data = {
            'table_id': 1,
            'dock_num': 1,
            # Добавьте сюда все необходимые поля формы
        }
        request = self.factory.post(reverse('work_for_ilia:city_cr_or_upd'), data=post_data)
        request.user = self.superuser

        response = city_form_view(request)
        self.assertEqual(response.status_code, 302)

    def test_post_request_invalid_form(self):
        # Создаем POST-запрос от суперпользователя с невалидной формой
        post_data = {
            'table_id': 1,
            'dock_num': 1,
            # Добавьте сюда все необходимые поля формы
        }
        request = self.factory.post(reverse('work_for_ilia:city_cr_or_upd'), data=post_data)
        request.user = self.superuser

        response = city_form_view(request)
        self.assertEqual(response.status_code, 200)  # Форма не валидна, отображается снова

    def test_ajax_request(self):
        # Создаем AJAX-запрос от суперпользователя
        request = self.factory.get(reverse('work_for_ilia:city_cr_or_upd'))
        request.META['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest'
        request.user = self.superuser

        response = city_form_view(request)
        self.assertEqual(response.status_code, 200)

    def test_access_denied(self):
        # Создаем запрос от пользователя не в группе и не суперпользователя
        request = self.factory.get(reverse('work_for_ilia:city_cr_or_upd'))
        request.user = self.user_not_in_group

        response = city_form_view(request)
        self.assertEqual(response.status_code, 302)  # Перенаправление на страницу входа


class TestCheckRecordExists(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_record_exists(self):
        # Создаем запись в базе данных
        table1 = SomeTables.objects.create(table_name='test_table_name')
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num='test_dock_num')
        # Создаем GET-запрос с table_id и dock_num
        get_data = {
            'table_id': table1.pk,  # Используйте pk таблицы, а не 1
            'dock_num': 1  # Используйте тот же dock_num, что и при создании записи
        }
        # Создаем GET-запрос с table_id и dock_num
        request = self.factory.get(reverse('work_for_ilia:check_record_exists'), data=get_data)

        response = check_record_exists(request)

        self.assertEqual(response.status_code, 200)

        # Декодируем содержимое ответа и парсим JSON
        data = json.loads(response.content.decode('utf-8'))

        self.assertIn('exists', data)
        self.assertTrue(data['exists'])

    def test_record_does_not_exist(self):
        # Создаем GET-запрос с table_id и dock_num, но запись не существует
        get_data = {
            'table_id': 1,  # Используйте pk таблицы, а не 1
            'dock_num': 1  # Используйте тот же dock_num, что и при создании записи
        }
        # Создаем GET-запрос с table_id и dock_num
        request = self.factory.get(reverse('work_for_ilia:check_record_exists'), data=get_data)

        response = check_record_exists(request)
        self.assertEqual(response.status_code, 200)

        # Декодируем содержимое ответа и парсим JSON
        data = json.loads(response.content.decode('utf-8'))

        self.assertIn('exists', data)
        self.assertFalse(data['exists'])

    def test_no_table_id_or_dock_num(self):
        # Создаем GET-запрос без table_id и dock_num
        request = self.factory.get(reverse('work_for_ilia:check_record_exists'))

        response = check_record_exists(request)
        self.assertEqual(response.status_code, 200)

        # Декодируем содержимое ответа и парсим JSON
        data = json.loads(response.content.decode('utf-8'))

        self.assertIn('exists', data)
        self.assertFalse(data['exists'])


class TestGetNextDockNum(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_get_next_dock_num_with_table_id(self):
        # Создаем записи в базе данных
        table1 = SomeTables.objects.create(table_name="test_table_name")
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num='1')
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num='2')
        get_data = {
            'table_id': 1
        }
        # Создаем GET-запрос с table_id
        request = self.factory.get(reverse('work_for_ilia:get_next_dock_num'), data=get_data)

        response = get_next_dock_num(request)

        self.assertEqual(response.status_code, 200)

        # Декодируем содержимое ответа и парсим JSON
        data = json.loads(response.content.decode('utf-8'))

        self.assertIn('next_dock_num', data)
        self.assertEqual(data['next_dock_num'], 3)

    def test_get_next_dock_num_without_table_id(self):
        # Создаем GET-запрос без table_id
        request = self.factory.get(reverse('work_for_ilia:get_next_dock_num'))

        response = get_next_dock_num(request)

        self.assertEqual(response.status_code, 200)

        # Декодируем содержимое ответа и парсим JSON
        data = json.loads(response.content.decode('utf-8'))

        self.assertIn('next_dock_num', data)
        self.assertEqual(data['next_dock_num'], '')

    def test_get_next_dock_num_with_empty_table_id(self):
        # Создаем GET-запрос с пустым table_id
        get_data = {
            'table_id': ''
        }
        request = self.factory.get(reverse('work_for_ilia:get_next_dock_num'), data=get_data)

        response = get_next_dock_num(request)

        self.assertEqual(response.status_code, 200)

        # Декодируем содержимое ответа и парсим JSON
        data = json.loads(response.content.decode('utf-8'))

        self.assertIn('next_dock_num', data)
        self.assertEqual(data['next_dock_num'], '')
