"""
Czech-localized password validators for Django authentication.
"""

import re
from difflib import SequenceMatcher

from django.contrib.auth.password_validation import (
    CommonPasswordValidator as DjangoCommonPasswordValidator,
    MinimumLengthValidator as DjangoMinimumLengthValidator,
    NumericPasswordValidator as DjangoNumericPasswordValidator,
    UserAttributeSimilarityValidator as DjangoUserAttributeSimilarityValidator,
    exceeds_maximum_length_ratio,
)
from django.core.exceptions import FieldDoesNotExist, ValidationError


class CzechUserAttributeSimilarityValidator(DjangoUserAttributeSimilarityValidator):
    """Validates that password is not too similar to username, email, etc."""

    VERBOSE_NAME_TRANSLATIONS = {
        "username": "uživatelskému jménu",
        "email": "e-mailové adrese",
        "first_name": "křestnímu jménu",
        "last_name": "příjmení",
    }

    def validate(self, password, user=None):
        if not user:
            return

        password = password.lower()
        for attribute_name in self.user_attributes:
            value = getattr(user, attribute_name, None)
            if not value or not isinstance(value, str):
                continue
            value_lower = value.lower()
            value_parts = [*re.split(r"\W+", value_lower), value_lower]
            for value_part in value_parts:
                if exceeds_maximum_length_ratio(
                    password, self.max_similarity, value_part
                ):
                    continue
                if (
                    SequenceMatcher(a=password, b=value_part).quick_ratio()
                    >= self.max_similarity
                ):
                    try:
                        verbose_name = str(
                            user._meta.get_field(attribute_name).verbose_name
                        )
                    except FieldDoesNotExist:
                        verbose_name = attribute_name

                    czech_name = self.VERBOSE_NAME_TRANSLATIONS.get(
                        attribute_name, verbose_name
                    )
                    raise ValidationError(
                        self.get_error_message(czech_name),
                        code="password_too_similar",
                        params={"verbose_name": czech_name},
                    )

    def get_error_message(self, verbose_name: str = "osobním údajům"):
        return f"Heslo je příliš podobné vašim osobním údajům ({verbose_name})."

    def get_help_text(self):
        return "Heslo nesmí být příliš podobné vašemu uživatelskému jménu nebo e-mailu."


class CzechMinimumLengthValidator(DjangoMinimumLengthValidator):
    """Validates that password has a minimum length with proper Czech declension."""

    def get_error_message(self):
        n = self.min_length
        if n == 1:
            unit = "znak"
        elif 2 <= n <= 4:
            unit = "znaky"
        else:
            unit = "znaků"
        return f"Heslo je příliš krátké. Musí obsahovat alespoň {n} {unit}."

    def get_help_text(self):
        n = self.min_length
        if n == 1:
            unit = "znak"
        elif 2 <= n <= 4:
            unit = "znaky"
        else:
            unit = "znaků"
        return f"Vaše heslo musí obsahovat alespoň {n} {unit}."


class CzechCommonPasswordValidator(DjangoCommonPasswordValidator):
    """Validates that password is not in the list of common passwords."""

    def get_error_message(self):
        return "Toto heslo je příliš běžné a snadno odhadnutelné."

    def get_help_text(self):
        return "Heslo nesmí patřit mezi často používaná hesla."


class CzechNumericPasswordValidator(DjangoNumericPasswordValidator):
    """Validates that password does not consist only of numbers."""

    def get_error_message(self):
        return "Heslo se nesmí skládat pouze z čísel."

    def get_help_text(self):
        return "Heslo nemůže být tvořeno pouze čísly."
