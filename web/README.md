# Фронтенд ОтзоВышки

React + TypeScript + Vite.

## Запуск

Нужен Node.js 20.19+ (или 22.12+).

```sh
npm install
npm run dev        # http://localhost:5173
```

В режиме разработки запросы `/auth/*`, `/me`, `/health` проксируются на бэкенд `http://localhost:8080`
(другой адрес — через переменную `BACKEND_URL`). Фронтенд и API должны жить на одном origin:
сессия хранится в HttpOnly-cookie.

## Скрипты

| Команда                | Что делает                                   |
| ---------------------- | -------------------------------------------- |
| `npm run build`        | проверка типов и production-сборка в `dist/` |
| `npm run preview`      | локальный просмотр собранной версии          |
| `npm run typecheck`    | только проверка типов                        |
| `npm run lint`         | ESLint                                       |
| `npm run format`       | Prettier                                     |
| `npm run format:check` | проверка форматирования (для CI)             |

## Структура

```
src/
  components/ui/   примитивы дизайн-системы: Button, IconButton, TextField, SearchField, DirectionMark
  features/        экраны и их логика (auth — страница входа, theme — светлая/тёмная тема)
  shared/api/      адреса эндпоинтов бэкенда
  lib/             общие хелперы и хуки
  styles/tokens/   токены дизайн-системы: цвета, типографика, отступы
```

Шрифты (Manrope, Unbounded) и иконки (Lucide) подключаются из npm-пакетов, внешние CDN не используются.
