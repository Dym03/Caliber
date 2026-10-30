from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.contrib.auth.password_validation import validate_password

from .models import (
    User,
    Gene,
    GeneVariant,
    GeneticReport,
    Patient,
    PatientVariant,
    TranscriptAnnotation,
    VariantDbSnp,
)


class UserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = User
        fields = ("email", "username")

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Zadaná hesla se neshodují.")
        if password1:
            validate_password(password1, self.instance)
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = (
            "email",
            "username",
            "password",
            "is_active",
            "is_staff",
            "is_superuser",
        )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = ("email", "username", "is_active", "is_staff", "is_superuser")
    list_editable = ("is_active",)
    list_filter = ("is_staff", "is_superuser", "is_active")
    ordering = ("email",)
    search_fields = ("email", "username")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("username",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_created")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2"),
            },
        ),
    )


class VariantDbSnpInline(admin.TabularInline):
    model = VariantDbSnp
    extra = 0


@admin.register(GeneVariant)
class GeneVariantAdmin(admin.ModelAdmin):
    list_display = ("chromosome", "position", "variation_type", "dbsnp", "gnomAD")
    search_fields = ("chromosome", "dbsnps__rsid")
    inlines = [VariantDbSnpInline]


admin.site.register(Patient)
admin.site.register(Gene)
admin.site.register(TranscriptAnnotation)
admin.site.register(VariantDbSnp)
admin.site.register(GeneticReport)
admin.site.register(PatientVariant)

admin.site.site_header = "Caliber Administrace"
admin.site.site_title = "Caliber Admin"
admin.site.index_title = "Správa registru"
