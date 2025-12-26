"use strict";

$(function() {
    // Бургер-меню
    $(".jsSandwich").click(function() {
        $(this).toggleClass("sandwich--active");
        $(".menu").toggleClass("menu--active");
        $("body").toggleClass("body--no-scroll");
    });

    // Переменные для модального окна
    const modal = $("#callbackModal"),
        openBtns = $(".jsOpenModalBtn"),
        closeBtn = $("#closeModalBtn"),
        form = $("#callbackForm"),
        phoneInput = $("#userPhone"),
        nameInput = $("#userName"),
        body = $("body"),
        formMessage = $("#formMessage");

    // Открытие модального окна
    openBtns.on("click", function() {
        modal.addClass("active");
        body.css("overflow", "hidden");
        formMessage.hide().empty();
    });

    // Закрытие модального окна
    closeBtn.on("click", function() {
        modal.removeClass("active");
        body.css("overflow", "");
    });

    // Закрытие по клику вне окна
    modal.on("click", function(e) {
        if (e.target === this) {
            $(this).removeClass("active");
            body.css("overflow", "");
        }
    });

    // Закрытие по ESC
    $(document).on("keydown", function(e) {
        if (e.key === "Escape" && modal.hasClass("active")) {
            modal.removeClass("active");
            body.css("overflow", "");
        }
    });

    // Фокус на имя при открытии
    openBtns.on("click", function() {
        setTimeout(function() {
            nameInput.focus();
        }, 300);
    });

    var $callbackForm = $("#callbackForm");
    var $userPhone    = $("#userPhone");
    var $userName     = $("#userName");
    var $body         = $("body");
    var $modal        = $("#callbackModal");

    // ... ваш уже существующий код маски телефона и т.п. ...

    $callbackForm.on("submit", function (e) {
        e.preventDefault();

        var name  = $userName.val().trim();
        var phone = $userPhone.val().trim();
        var $errorBlock = $("#formError");

        $errorBlock.hide().text("");

        // Простая клиентская проверка
        if (!name || !phone) {
            $errorBlock.text("Заполните все поля.").show();
            return;
        }

        fetch("handler.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify({ name: name, phone: phone })
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data.success) {
                    // Успех: скрыть форму, показать сообщение
                    $callbackForm.hide();
                    $('.modal__subtitle').hide();
                    $(".modal__header").html('Ваша заявка принята.');
                } else {
                    // Ошибка валидации/логики
                    $errorBlock.text(data.message || "Ошибка отправки формы").show();
                }
            })
            .catch(function () {
                $errorBlock.text("Техническая ошибка, попробуйте позже.").show();
            });
    });
});