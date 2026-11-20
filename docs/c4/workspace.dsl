workspace "ОтзоВышка" {
    model {
        student = person "Студент" "Учится в ВШЭ." "Студент"
        lecturer = person "Преподаватель" "Проводит занятия в ВШЭ." "Преподаватель"
        admin = person "Администратор" "Отвечает за соблюдение правил на платформе." "Администратор"

        hseReviews = softwareSystem "ОтзоВышка" "Сервис отзывов для выбора дисциплин и преподавателей в ВШЭ." "ОтзоВышка" {
            web = container "Веб-интерфейс" "Работает в браузере. Показывает каталог майноров, отзывы и форму отправки отзыва." "React, TypeScript"
            backend = container "Серверное приложение" "Монолит на Go. Управляет входом и сессиями, обслуживает API каталога и отзывов." "Go" {
                httpServer = component "HTTP-маршруты" "Регистрирует обработчики и подключает проверку сессии для защищённых маршрутов." "net/http (internal/app)"
                auth = component "Аутентификация и сессии" "Перенаправляет браузер на вход в HSE Auth, обрабатывает возврат и проверяет сессию по cookie." "Go, OpenID Connect (internal/auth)"
                minors = component "Каталог майноров" "Возвращает список майноров и данные отдельного майнора." "Go (internal/minors)"
                reviews = component "Отзывы" "Сохраняет новые отзывы со статусом «на проверке». Возвращает опубликованные отзывы о майноре и отзывы текущего пользователя." "Go (internal/reviews)"
                accountStore = component "Хранилище пользователей и сессий" "Сохраняет записи пользователей и создаёт, ищет и удаляет сессии." "Go, pgx (internal/repository)"
            }
            database = container "База данных" "Хранит пользователей, сессии, майноры и отзывы." "PostgreSQL" "База данных"
        }
        hseAuth = softwareSystem "HSE Auth" "Провайдер входа для пользователей ВШЭ." "HSE Auth"

        student -> hseReviews "Читает и оставляет отзывы" "" "Связь"
        lecturer -> hseReviews "Читает отзывы и оставляет жалобы" "" "Связь"
        admin -> hseReviews "Модерирует отзывы и обрабатывает жалобы" "" "Связь"
        hseReviews -> hseAuth "Использует для аутентификации пользователей" "" "Связь"

        student -> web "Входит, выбирает майнор, читает и оставляет отзывы" "Браузер" "Связь"
        web -> backend "Начинает вход и обращается к JSON API каталога и отзывов" "HTTP" "Связь"
        backend -> database "Читает и сохраняет данные сервиса" "SQL" "Связь"
        backend -> hseAuth "Обменивает код входа на токены и получает ключи для проверки ID-токена" "OpenID Connect" "Связь"

        web -> httpServer "Обращается к маршрутам входа, каталога и отзывов" "HTTP" "Связь"
        httpServer -> auth "Подключает обработчики входа и выхода и проверку сессии" "" "Связь"
        httpServer -> minors "Направляет запросы каталога" "" "Связь"
        httpServer -> reviews "Направляет запросы чтения и отправки отзывов" "" "Связь"
        auth -> hseAuth "Обменивает код входа на токены и получает ключи для проверки подписи" "OpenID Connect" "Связь"
        auth -> accountStore "Сохраняет пользователя и управляет сессиями" "" "Связь"
        accountStore -> database "Читает и сохраняет пользователей и сессии" "SQL" "Связь"
        minors -> database "Читает данные майноров" "SQL" "Связь"
        reviews -> database "Проверяет существование майнора, читает и сохраняет отзывы" "SQL" "Связь"
    }

    views {
        systemContext hseReviews "1-context" {
            title "[Контекст] ОтзоВышка"
            description "Диаграмма контекста для сервиса «ОтзоВышка»."
            include *
            autoLayout lr
        }

        container hseReviews "2-containers" {
            title "[Контейнеры] ОтзоВышка"
            description "Архитектура первой версии каталога майноров с веб-интерфейсом на React."
            include student web backend database hseAuth
            autoLayout lr
        }

        component backend "3-components" {
            title "[Компоненты] Серверное приложение ОтзоВышки"
            description "Компоненты Go-приложения и их связи с веб-интерфейсом, базой данных и провайдером входа."
            include web httpServer auth minors reviews accountStore database hseAuth
            autoLayout lr
        }

        terminology {
            person "Человек"
            softwareSystem "Программная система"
            container "Контейнер"
            component "Компонент"
        }

        styles {
            element "Студент" {
                shape Person
                background #FFFFFF
                color #ED8609
                stroke #ED8609
                strokeWidth 8
                fontSize 24
            }

            element "Преподаватель" {
                shape Person
                background #FFFFFF
                stroke #297E06
                color #297E06
                strokeWidth 8
                fontSize 24
            }

            element "Администратор" {
                shape Person
                background #FFFFFF
                color #6A3D9A
                stroke #6A3D9A
                strokeWidth 8
                fontSize 24
            }

            element "ОтзоВышка" {
                shape RoundedBox
                background #FFFFFF
                color #1168BD
                stroke #1168BD
                strokeWidth 8
                fontSize 32
            }

            element "HSE Auth" {
                shape RoundedBox
                background #FFFFFF
                color #BF101D
                stroke #BF101D
                strokeWidth 8
                fontSize 32
            }

            element "Container" {
                shape RoundedBox
                background #FFFFFF
                color #1168BD
                stroke #1168BD
                strokeWidth 8
                fontSize 28
            }

            element "База данных" {
                shape Cylinder
            }

            element "Component" {
                shape RoundedBox
                background #FFFFFF
                color #1168BD
                stroke #1168BD
                strokeWidth 6
                fontSize 24
            }

            relationship "Связь" {
                color #444444
                style dashed
            }
        }

        properties {
            "structurizr.metadata" "false"
        }
    }
}
