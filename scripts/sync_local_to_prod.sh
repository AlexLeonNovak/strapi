#!/bin/bash

timestamp=`date +%d-%m-%Y"_"%H_%M_%S`

echo "Dumping production database to dumps/"
echo "pg_dump -h postgres -U strapi -Fc strapi > dumps/dump_$timestamp.dump"
ssh api.setsailrealty.ca "docker-compose -f setsailrealty_api/prod.yml run --rm -e PGPASSWORD=strapi postgres pg_dump -h postgres -U strapi -Fc strapi" > dumps/dump_$timestamp.dump

echo "Stopping container web"
echo "docker-compose -f local.yml stop strapi"
docker-compose -f local.yml stop strapi

echo "Dropping local database postgres"
echo "dropdb -h postgres -U strapi strapi"
docker-compose -f local.yml run --rm -e PGPASSWORD=strapi postgres dropdb -h postgres -U strapi strapi

echo "Creating local database postgres"
echo "createdb -h postgres -U strapi strapi"
docker-compose -f local.yml run --rm -e PGPASSWORD=strapi postgres createdb -h postgres -U strapi strapi

echo "Restoring dump to local database"
echo "pg_restore -h postgres -U strapi -d strapi dumps/dump_$timestamp.dump"
docker-compose -f local.yml run --rm -e PGPASSWORD=strapi postgres pg_restore -h postgres -U strapi -d strapi dumps/dump_$timestamp.dump

echo "Starting container web"
echo "docker-compose -f local.yml start strapi"
docker-compose -f local.yml start strapi

echo "Syncing uploads folder"
echo "rsync -r api.setsailrealty.ca:~/setsailrealty_api/app/public/uploads/ app/public/uploads/"
rsync -r api.setsailrealty.ca:~/setsailrealty_api/app/public/uploads/ app/public/uploads/

echo "Sync complete"