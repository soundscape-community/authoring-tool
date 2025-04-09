from django.core.management.base import BaseCommand, CommandError
from api.models import User

class Command(BaseCommand):
    help = 'Print list of all users'

    def handle(self, *args, **options):
        try:
            users = User.objects.all()
            print('--ALL USERS--')
            print('Username\tEmail')
            for user in users:
                print(user.get_username() + '\t' + user.email)
        except Exception as e:
            raise CommandError('Error')
        self.stdout.write(self.style.SUCCESS('End of user list'))