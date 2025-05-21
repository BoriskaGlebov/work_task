# core/templatetags/user_filters.py

"""
Пользовательский шаблонный фильтр для Django, позволяющий проверить,
состоит ли пользователь в определённой группе.

Пример использования в шаблоне:
    {% load user_filters %}
    {% if user|in_group:"admin" %}
        Пользователь в группе admin
    {% endif %}
"""

from django import template

# Регистрируем объект библиотеки шаблонов
register = template.Library()


@register.filter(name='in_group')
def in_group(user, group_name):
    """
    Проверяет, состоит ли пользователь в указанной группе.

    Args:
        user (User): Объект пользователя Django.
        group_name (str): Название группы для проверки.

    Returns:
        bool: True, если пользователь состоит в группе с указанным именем, иначе False.
    """
    return user.groups.filter(name=group_name).exists()
