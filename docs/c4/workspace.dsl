workspace "ОтзоВышка" {
    model {
        student = person "Студент" "Учится в ВШЭ." "Студент"
        lecturer = person "Преподаватель" "Проводит занятия в ВШЭ." "Преподаватель"
        admin = person "Администратор" "Отвечает за соблюдение правил на платформе." "Администратор"

        hseReviews = softwareSystem "ОтзоВышка" "Сервис отзывов для выбора дисциплин и преподавателей в ВШЭ." "ОтзоВышка" {
            web = container "Веб-интерфейс" "Предоставляет пользователям доступ к функциям ОтзоВышки через браузер." "React, TypeScript" "Веб-интерфейс"
            backend = container "Бэкенд" "Предоставляет API ОтзоВышки и управляет пользовательскими сессиями." "Go" "Бэкенд"
            database = container "База данных" "Хранит каталог, отзывы, пользовательские сессии и другие данные ОтзоВышки." "PostgreSQL" "База данных"
        }
        hseAuth = softwareSystem "HSE Auth" "Провайдер входа для пользователей ВШЭ." "HSE Auth"

        student -> hseReviews "Читает и оставляет отзывы" "" "Связь"
        lecturer -> hseReviews "Читает отзывы и оставляет жалобы" "" "Связь"
        admin -> hseReviews "Модерирует отзывы и обрабатывает жалобы" "" "Связь"
        hseReviews -> hseAuth "Использует для аутентификации пользователей" "" "Связь"

        student -> web "Читает и оставляет отзывы" "" "Связь"
        lecturer -> web "Читает отзывы и оставляет жалобы" "" "Связь"
        admin -> web "Модерирует отзывы и обрабатывает жалобы" "" "Связь"
        web -> backend "Выполняет API-запросы" "JSON/HTTP" "Связь"
        backend -> database "Читает и записывает данные" "SQL" "Связь"
        backend -> hseAuth "Использует для аутентификации пользователей" "OpenID Connect" "Связь"
    }

    views {
        systemContext hseReviews "1-context" {
            title "[Контекст] ОтзоВышка"
            description "Диаграмма контекста для сервиса «ОтзоВышка»."
            include *
            autoLayout lr
        }

        container hseReviews "2-container" {
            title "[Контейнер] ОтзоВышка"
            description "Диаграмма контейнера для сервиса «ОтзоВышка»."
            include *
            autoLayout lr
        }

        terminology {
            person "Человек"
            softwareSystem "Программная система"
            container "Контейнер"
        }

        styles {
            element "Студент" {
                shape Person
                background #FFFFFF
                color #ED8609
                stroke #ED8609
                strokeWidth 8
                fontSize 28
            }

            element "Преподаватель" {
                shape Person
                background #FFFFFF
                stroke #297E06
                color #297E06
                strokeWidth 8
                fontSize 28
            }

            element "Администратор" {
                shape Person
                background #FFFFFF
                color #6A3D9A
                stroke #6A3D9A
                strokeWidth 8
                fontSize 28
            }

            element "ОтзоВышка" {
                shape RoundedBox
                background #FFFFFF
                color #1168BD
                stroke #1168BD
                strokeWidth 8
                fontSize 28
            }

            element "HSE Auth" {
                shape RoundedBox
                background #FFFFFF
                color #BF101D
                stroke #BF101D
                strokeWidth 8
                fontSize 28
            }

            element "Веб-интерфейс" {
                shape WebBrowser
                background #FFFFFF
                color #1168BD
                stroke #1168BD
                strokeWidth 8
                fontSize 28
            }

            element "Бэкенд" {
                shape Shell
                background #FFFFFF
                color #1168BD
                stroke #1168BD
                strokeWidth 8
                fontSize 28
            }

            element "База данных" {
                shape Cylinder
                background #FFFFFF
                color #1168BD
                stroke #1168BD
                strokeWidth 8
                fontSize 28
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
