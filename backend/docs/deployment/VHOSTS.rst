Apache + mod-wsgi configuration
===============================

An example Apache2 vhost configuration follows::

    WSGIDaemonProcess openarchiefbeheer-<target> threads=5 maximum-requests=1000 user=<user> group=staff
    WSGIRestrictStdout Off

    <VirtualHost *:80>
        ServerName my.domain.name

        ErrorLog "/srv/sites/openarchiefbeheer/log/apache2/error.log"
        CustomLog "/srv/sites/openarchiefbeheer/log/apache2/access.log" common

        WSGIProcessGroup openarchiefbeheer-<target>

        Alias /media "/srv/sites/openarchiefbeheer/media/"
        Alias /static "/srv/sites/openarchiefbeheer/static/"

        WSGIScriptAlias / "/srv/sites/openarchiefbeheer/src/openarchiefbeheer/wsgi/wsgi_<target>.py"
    </VirtualHost>


Nginx + uwsgi + supervisor configuration
========================================

Supervisor/uwsgi:
-----------------

.. code::

    [program:uwsgi-openarchiefbeheer-<target>]
    user = <user>
    command = /srv/sites/openarchiefbeheer/env/bin/uwsgi --socket 127.0.0.1:8001 --wsgi-file /srv/sites/openarchiefbeheer/src/openarchiefbeheer/wsgi/wsgi_<target>.py
    home = /srv/sites/openarchiefbeheer/env
    master = true
    processes = 8
    harakiri = 600
    autostart = true
    autorestart = true
    stderr_logfile = /srv/sites/openarchiefbeheer/log/uwsgi_err.log
    stdout_logfile = /srv/sites/openarchiefbeheer/log/uwsgi_out.log
    stopsignal = QUIT

Nginx
-----

.. code::

    upstream django_openarchiefbeheer_<target> {
      ip_hash;
      server 127.0.0.1:8001;
    }

    server {
      listen :80;
      server_name  my.domain.name;

      access_log /srv/sites/openarchiefbeheer/log/nginx-access.log;
      error_log /srv/sites/openarchiefbeheer/log/nginx-error.log;

      location /500.html {
        root /srv/sites/openarchiefbeheer/src/openarchiefbeheer/templates/;
      }
      error_page 500 502 503 504 /500.html;

      location /static/ {
        alias /srv/sites/openarchiefbeheer/static/;
        expires 30d;
      }

      location /media/ {
        alias /srv/sites/openarchiefbeheer/media/;
        expires 30d;
      }

      location / {
        uwsgi_pass django_openarchiefbeheer_<target>;
      }
    }
