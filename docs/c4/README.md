# Архитектура проекта

Модель C4 описана в файле [`workspace.dsl`](workspace.dsl).

## Контекст

![Контекст](diagrams/1-context.svg)

## Контейнер

![Контейнер](diagrams/2-container.svg)

## Экспорт диаграмм в SVG

При запущенном Docker выполните команду из корня репозитория.

```sh
docker compose --file docs/c4/compose.yaml run --rm --no-TTY c4-export
```
