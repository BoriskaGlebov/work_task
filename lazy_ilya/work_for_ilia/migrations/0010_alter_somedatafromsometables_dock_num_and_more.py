# Generated by Django 4.2.19 on 2025-02-15 16:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("work_for_ilia", "0009_alter_somedatafromsometables_pseudonim"),
    ]

    operations = [
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="dock_num",
            field=models.IntegerField(blank=True, default=9999, verbose_name="№ п/п"),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="ip_address",
            field=models.CharField(
                blank=True, max_length=255, null=True, verbose_name="Адрес IP"
            ),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="letters",
            field=models.BooleanField(
                blank=True, default=False, null=True, verbose_name="Письма"
            ),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="location",
            field=models.CharField(
                blank=True, max_length=255, null=True, verbose_name="Город"
            ),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="name_organ",
            field=models.CharField(
                blank=True, max_length=255, null=True, verbose_name="Название органа"
            ),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="pseudonim",
            field=models.CharField(
                blank=True, max_length=255, null=True, verbose_name="Псевдоним"
            ),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="some_number",
            field=models.CharField(
                blank=True, max_length=255, null=True, verbose_name="Спец номер"
            ),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="work_timme",
            field=models.CharField(
                blank=True, max_length=255, null=True, verbose_name="Рабочее время"
            ),
        ),
        migrations.AlterField(
            model_name="somedatafromsometables",
            name="writing",
            field=models.BooleanField(
                blank=True, default=False, null=True, verbose_name="Записи"
            ),
        ),
    ]
