FROM mcr.microsoft.com/cbl-mariner/base/core:2.0 as installer

RUN tdnf -y update \
 && tdnf install -y dnf \
 && mkdir /staging \
 && dnf install -y --release=2.0 --installroot /staging prebuilt-ca-certificates python3 python3-pip nodejs

FROM mcr.microsoft.com/cbl-mariner/distroless/base:2.0 as final

COPY --from=installer /staging/ /

COPY . /app
WORKDIR /app

RUN pip3 install wheel setuptools && pip install -r backend/requirements.txt
RUN cd frontend && npm install && npm run build

ENV PYTHONPATH=/app/backend
ENV DJANGO_SETTINGS_MODULE=backend.settings.local
ENV DJANGO_SECRET_KEY=bogus

ENTRYPOINT python3 /app/backend/manage.py runserver
