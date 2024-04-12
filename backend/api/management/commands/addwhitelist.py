from django.core.management.base import BaseCommand, CommandError
from api.models import WhitelistedEmail

class Command(BaseCommand):
    help = 'Adding an email to the signup email whitelist'

    def handle(self, *args, **options):
        try:
            email = input("Enter email: ")
            WhitelistedEmail.objects.create(email=email)
        except Exception as e:
            raise CommandError('Error: ' + e)
        self.stdout.write(self.style.SUCCESS('Successfully added ' + email + ' to whitelist'))