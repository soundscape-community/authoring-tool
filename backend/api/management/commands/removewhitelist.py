from django.core.management.base import BaseCommand, CommandError
from api.models import WhitelistedEmail

class Command(BaseCommand):
    help = 'Removing an email from the signup email whitelist'

    def handle(self, *args, **options):
        try:
            email = input("Enter email: ")
            WhitelistedEmail.objects.filter(email=email).delete()
        except Exception as e:
            raise CommandError('Error: ' + e)
        self.stdout.write(self.style.SUCCESS('Successfully removed ' + email + ' from whitelist'))