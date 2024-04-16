from django.core.management.base import BaseCommand, CommandError
from api.models import WhitelistedEmail

class Command(BaseCommand):
    help = 'Print list of all whitelisted signup emails'

    def handle(self, *args, **options):
        try:
            we = WhitelistedEmail.objects.all()
            print('--SIGNUP EMAIL WHITELIST--')
            for email in we:
                print(email.email)
        except Exception as e:
            raise CommandError('Error')
        self.stdout.write(self.style.SUCCESS('End of whitelist'))