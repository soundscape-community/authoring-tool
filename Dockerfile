# To run:
#   docker build . -t authoring-tool
#   docker run -p 8000:8000 -it --rm authoring-tool 

FROM mcr.microsoft.com/cbl-mariner/base/core:2.0 as installer

RUN tdnf -y update \
 && tdnf install -y dnf \
 && mkdir /staging \
 && dnf install -y --release=2.0 --installroot /staging prebuilt-ca-certificates python3 python3-pip nodejs

FROM mcr.microsoft.com/cbl-mariner/distroless/base:2.0 as final

COPY --from=installer /staging/ /

COPY . /app
WORKDIR /app

ENV PYTHONPATH=/app/backend
ENV DJANGO_SETTINGS_MODULE=backend.settings.local
ENV DJANGO_SECRET_KEY=bogus

RUN pip3 install wheel setuptools gunicorn && pip install -r backend/requirements.txt
RUN cd frontend && npm install && npm run build

ENTRYPOINT gunicorn backend.wsgi:application --bind 0.0.0.0:8000