from django.db import models
from django.utils import timezone


class CubeSolve(models.Model):
    """
    Model to store Rubik's cube solve records.
    """

    facelet_string = models.CharField(
        max_length=54,
        help_text="The 54-character kociemba facelet string representing the cube state",
    )
    solution = models.TextField(
        help_text="The solution moves as a space-separated string"
    )
    move_count = models.IntegerField(help_text="Number of moves in the solution")
    solve_time_ms = models.FloatField(help_text="Time taken to solve in milliseconds")
    timestamp = models.DateTimeField(
        default=timezone.now, help_text="When the solve was performed"
    )
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, help_text="IP address of the client (optional)"
    )

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Cube Solve"
        verbose_name_plural = "Cube Solves"

    def __str__(self):
        return f"Solve at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - {self.move_count} moves"
