workspace "ОтзоВышка" {
    model {
        student = person "Студент" "Учится в ВШЭ." "Студент"
        lecturer = person "Преподаватель" "Проводит занятия в ВШЭ." "Преподаватель"
        admin = person "Администратор" "Отвечает за соблюдение правил на платформе." "Администратор"

        hseReviews = softwareSystem "ОтзоВышка" "Сервис отзывов для выбора дисциплин и преподавателей в ВШЭ." "ОтзоВышка"
        hseAuth = softwareSystem "HSE Auth" "Провайдер входа для пользователей ВШЭ." "HSE Auth"

        student -> hseReviews "Читает и оставляет отзывы" "" "Связь"
        lecturer -> hseReviews "Читает отзывы и оставляет жалобы" "" "Связь"
        admin -> hseReviews "Модерирует отзывы и обрабатывает жалобы" "" "Связь"
        hseReviews -> hseAuth "Использует для аутентификации пользователей" "" "Связь"
    }

    views {
        systemContext hseReviews "1-context" {
            title "[Контекст] ОтзоВышка"
            description "Диаграмма контекста для сервиса «ОтзоВышка»."
            include *
            autoLayout lr
        }

        terminology {
            person "Человек"
            softwareSystem "Программная система"
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
