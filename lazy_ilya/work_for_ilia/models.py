from django.db import models


# Create your models here.
class Counter(models.Model):
    processed_at = models.DateTimeField(auto_now_add=True)
    num_files = models.IntegerField()

    def __str__(self):
        return f"Processed on {self.processed_at} = {self.num_files}"
