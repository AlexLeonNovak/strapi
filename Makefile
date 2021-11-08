up:
	docker-compose -f local.yml up -d

down:
	docker-compose -f local.yml down

log:
	docker-compose -f local.yml logs -f --tail=200

restart: down up
